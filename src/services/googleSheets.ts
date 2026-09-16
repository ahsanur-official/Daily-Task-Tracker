import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Goal, Task, TimeSession, Certificate } from '../types';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';

const SPREADSHEET_STORAGE_KEY = 'dt_google_sheets_id';
const SHEETS_TOKEN_STORAGE_KEY = 'dt_google_sheets_token';
const LAST_SYNCED_KEY = 'dt_google_sheets_last_sync';

export interface GoogleSheetsSyncStatus {
  connected: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSynced: string | null;
  isSyncing: boolean;
  error: string | null;
}

// Ensure GIS types exist
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: any }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

class GoogleSheetsService {
  private accessToken: string | null = null;
  private tokenClient: any = null;

  constructor() {
    this.accessToken = loadFromLocalStorage<string | null>(SHEETS_TOKEN_STORAGE_KEY, null);
  }

  public getStoredSpreadsheetId(): string | null {
    return loadFromLocalStorage<string | null>(SPREADSHEET_STORAGE_KEY, null);
  }

  public getStoredLastSync(): string | null {
    return loadFromLocalStorage<string | null>(LAST_SYNCED_KEY, null);
  }

  public hasToken(): boolean {
    return !!this.accessToken;
  }

  public setAccessToken(token: string) {
    this.accessToken = token;
    saveToLocalStorage(SHEETS_TOKEN_STORAGE_KEY, token);
  }

  public clearAuth() {
    this.accessToken = null;
    localStorage.removeItem(SHEETS_TOKEN_STORAGE_KEY);
  }

  /**
   * Request Google OAuth token with spreadsheets scope using Google Identity Services (GIS)
   */
  public async requestOAuthToken(): Promise<string> {
    const clientId = (firebaseConfig as any).oAuthClientId;
    if (!clientId) {
      throw new Error('OAuth Client ID is not configured in firebase-applet-config.json');
    }

    if (!window.google?.accounts?.oauth2) {
      // Wait briefly for GSI script to finish loading if needed
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services script is not loaded yet. Please verify your connection.');
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const tokenClient = window.google!.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error.message || response.error || 'Google Authorization failed'));
              return;
            }
            if (response.access_token) {
              this.setAccessToken(response.access_token);
              resolve(response.access_token);
            } else {
              reject(new Error('No access token returned from Google authentication'));
            }
          },
        });

        this.tokenClient = tokenClient;
        tokenClient.requestAccessToken({ prompt: '' });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Create or retrieve existing Google Sheet for Daily Task Tracker
   */
  public async getOrCreateSpreadsheet(token: string): Promise<string> {
    const existingId = this.getStoredSpreadsheetId();

    if (existingId) {
      try {
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${existingId}?fields=spreadsheetId,properties.title`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          return existingId;
        }
      } catch (err) {
        console.warn('Existing spreadsheet unreachable, creating fresh backup sheet:', err);
      }
    }

    // Create new Spreadsheet
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `Daily Task Tracker - User & Productivity Database`,
        },
        sheets: [
          { properties: { title: 'User Details & Profiles' } },
          { properties: { title: 'Goals & Targets' } },
          { properties: { title: 'Daily Tasks' } },
          { properties: { title: 'Focus Sessions' } },
        ],
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to create Google Sheet: ${response.statusText}`);
    }

    const data = await response.json();
    const newId = data.spreadsheetId;
    saveToLocalStorage(SPREADSHEET_STORAGE_KEY, newId);
    return newId;
  }

  /**
   * Synchronize full User Profile, Goals, Tasks, and Sessions to Google Sheets
   */
  public async syncToGoogleSheets(
    token: string,
    payload: {
      user: UserProfile | null;
      goals: Goal[];
      tasks: Task[];
      sessions: TimeSession[];
      certificates: Certificate[];
      streakDays?: number;
      bestStreakDays?: number;
    }
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const spreadsheetId = await this.getOrCreateSpreadsheet(token);

    const nowIso = new Date().toISOString();

    // 1. User Profiles & Summary Sheet
    const totalMinutes = payload.sessions.reduce((acc, s) => acc + Math.round(s.durationSeconds / 60), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    const userHeaders = [
      'User ID',
      'Full Name',
      'Email',
      'Username',
      'Occupation',
      'Company or School',
      'Location',
      'Bio',
      'Account Tier',
      'Daily Target (Hours)',
      'Work Start Time',
      'Work End Time',
      'Working Days',
      'Current Streak (Days)',
      'Best Streak (Days)',
      'Total Focus Time (Hours)',
      'Total Goals',
      'Completed Goals',
      'Total Tasks',
      'Time Zone',
      'Last Backup Timestamp',
    ];

    const userRows: (string | number)[][] = [
      userHeaders,
      [
        payload.user?.id || 'anonymous',
        payload.user?.fullName || 'Member',
        payload.user?.email || 'N/A',
        payload.user?.username || 'user',
        payload.user?.occupation || '',
        payload.user?.companyOrSchool || '',
        payload.user?.location || '',
        payload.user?.bio || '',
        payload.user?.accountTier || 'Standard Member',
        payload.user?.preferredDailyWorkingHours || 4,
        payload.user?.preferredWorkStartTime || '09:00',
        payload.user?.preferredWorkEndTime || '18:00',
        (payload.user?.workingDays || []).join(', '),
        payload.streakDays || 0,
        payload.bestStreakDays || 0,
        Number(totalHours),
        payload.goals.length,
        payload.goals.filter((g) => g.status === 'completed').length,
        payload.tasks.length,
        payload.user?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        nowIso,
      ],
    ];

    // 2. Goals Sheet
    const goalHeaders = [
      'Goal ID',
      'Title',
      'Category',
      'Status',
      'Duration Option',
      'Duration (Days)',
      'Start Date',
      'End Date',
      'Completed At',
      'Created At',
    ];

    const goalRows: (string | number)[][] = [
      goalHeaders,
      ...payload.goals.map((g) => [
        g.id,
        g.title,
        g.category,
        g.status.toUpperCase(),
        g.durationOption,
        g.durationDays,
        g.startDate,
        g.endDate,
        g.completedAt || 'In Progress',
        g.createdAt,
      ]),
    ];

    // 3. Tasks Sheet
    const taskHeaders = [
      'Task ID',
      'Goal Title',
      'Task Title',
      'Required Duration (Mins)',
      'Frequency',
      'Preferred Start Time',
      'Daily Deadline Time',
      'Created At',
    ];

    const taskRows: (string | number)[][] = [
      taskHeaders,
      ...payload.tasks.map((t) => {
        const goal = payload.goals.find((g) => g.id === t.goalId);
        return [
          t.id,
          goal?.title || 'General Goal',
          t.title,
          t.requiredDurationMinutes,
          t.frequency,
          t.preferredTime || 'Anytime',
          t.deadlineTime || 'End of Day',
          t.createdAt,
        ];
      }),
    ];

    // 4. Focus Sessions Sheet
    const sessionHeaders = [
      'Session ID',
      'Task Title',
      'Date (YYYY-MM-DD)',
      'Duration (Mins)',
      'Duration (Seconds)',
      'Sync Status',
      'Session Notes',
    ];

    const sessionRows: (string | number)[][] = [
      sessionHeaders,
      ...payload.sessions.slice(-100).reverse().map((s) => {
        const task = payload.tasks.find((t) => t.id === s.taskId);
        return [
          s.id,
          task?.title || 'General Focus Session',
          s.date,
          Math.round(s.durationSeconds / 60),
          s.durationSeconds,
          s.syncStatus,
          s.notes || '',
        ];
      }),
    ];

    // Push data via batchUpdate to ensure all sheets are populated in one shot
    await this.updateSheetValues(token, spreadsheetId, 'User Details & Profiles!A1:U20', userRows);
    await this.updateSheetValues(token, spreadsheetId, 'Goals & Targets!A1:J200', goalRows);
    await this.updateSheetValues(token, spreadsheetId, 'Daily Tasks!A1:H200', taskRows);
    await this.updateSheetValues(token, spreadsheetId, 'Focus Sessions!A1:G105', sessionRows);

    saveToLocalStorage(LAST_SYNCED_KEY, nowIso);

    return {
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    };
  }

  /**
   * Fast real-time sync of User Profile directly to Google Sheet
   */
  public async syncUserProfileOnly(
    token: string,
    user: UserProfile,
    extraMetrics?: { streakDays?: number; bestStreakDays?: number; totalHours?: number }
  ): Promise<void> {
    const spreadsheetId = await this.getOrCreateSpreadsheet(token);
    const nowIso = new Date().toISOString();

    const userRow = [
      user.id,
      user.fullName || 'Member',
      user.email || '',
      user.username || 'user',
      user.occupation || '',
      user.companyOrSchool || '',
      user.location || '',
      user.bio || '',
      user.accountTier || 'Standard Member',
      user.preferredDailyWorkingHours || 4,
      user.preferredWorkStartTime || '09:00',
      user.preferredWorkEndTime || '18:00',
      (user.workingDays || []).join(', '),
      extraMetrics?.streakDays ?? 0,
      extraMetrics?.bestStreakDays ?? 0,
      extraMetrics?.totalHours ?? 0,
      '', // Total Goals
      '', // Completed Goals
      '', // Total Tasks
      user.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      nowIso,
    ];

    await this.updateSheetValues(token, spreadsheetId, 'User Details & Profiles!A2:U2', [userRow]);
    saveToLocalStorage(LAST_SYNCED_KEY, nowIso);
  }

  /**
   * Read user details back from Google Sheet so user can manage profile in spreadsheet
   */
  public async pullUserProfileFromSheet(token: string): Promise<Partial<UserProfile> | null> {
    const spreadsheetId = this.getStoredSpreadsheetId();
    if (!spreadsheetId) return null;

    const values = await this.fetchSheetValues(token, spreadsheetId, 'User Details & Profiles!A2:U2');
    if (!values || values.length === 0 || !values[0] || values[0].length < 4) {
      return null;
    }

    const row = values[0];
    const pulledProfile: Partial<UserProfile> = {};

    if (row[1] && String(row[1]).trim()) pulledProfile.fullName = String(row[1]).trim();
    if (row[4] !== undefined) pulledProfile.occupation = String(row[4]).trim();
    if (row[5] !== undefined) pulledProfile.companyOrSchool = String(row[5]).trim();
    if (row[6] !== undefined) pulledProfile.location = String(row[6]).trim();
    if (row[7] !== undefined) pulledProfile.bio = String(row[7]).trim();
    if (row[8] && String(row[8]).trim()) {
      const tierVal = String(row[8]).trim();
      if (tierVal === 'Standard Member' || tierVal === 'Pro Practitioner' || tierVal === 'Master Disciplinarian') {
        pulledProfile.accountTier = tierVal;
      }
    }
    if (row[9] && !isNaN(Number(row[9]))) pulledProfile.preferredDailyWorkingHours = Number(row[9]);
    if (row[10] && String(row[10]).trim()) pulledProfile.preferredWorkStartTime = String(row[10]).trim();
    if (row[11] && String(row[11]).trim()) pulledProfile.preferredWorkEndTime = String(row[11]).trim();
    if (row[12] && String(row[12]).trim()) {
      pulledProfile.workingDays = String(row[12]).split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (row[19] && String(row[19]).trim()) pulledProfile.timeZone = String(row[19]).trim();

    return pulledProfile;
  }

  public async fetchSheetValues(token: string, spreadsheetId: string, range: string): Promise<any[][] | null> {
    const encodedRange = encodeURIComponent(range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.values || null;
    } catch {
      return null;
    }
  }

  private async updateSheetValues(
    token: string,
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    const encodedRange = encodeURIComponent(range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn(`Could not update Google Sheets range ${range}:`, errJson);
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
