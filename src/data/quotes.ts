export interface DailyQuoteItem {
  id: number;
  quote: string;
  author: string;
  category: 'Focus' | 'Discipline' | 'Consistency' | 'Resilience' | 'Growth' | 'Mindset' | 'Action';
}

export const PREDEFINED_QUOTES: DailyQuoteItem[] = [
  {
    id: 1,
    quote: "You do not rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear",
    category: "Consistency",
  },
  {
    id: 2,
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Will Durant",
    category: "Discipline",
  },
  {
    id: 3,
    quote: "The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks.",
    author: "Mark Twain",
    category: "Action",
  },
  {
    id: 4,
    quote: "Focus is a muscle. The more you practice single-tasking without distraction, the stronger it becomes.",
    author: "Cal Newport",
    category: "Focus",
  },
  {
    id: 5,
    quote: "Action isn't just the effect of motivation; it's also the cause of it.",
    author: "Mark Manson",
    category: "Action",
  },
  {
    id: 6,
    quote: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
    author: "Stephen King",
    category: "Discipline",
  },
  {
    id: 7,
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
    category: "Consistency",
  },
  {
    id: 8,
    quote: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca",
    category: "Focus",
  },
  {
    id: 9,
    quote: "Do what you can, with what you have, where you are.",
    author: "Theodore Roosevelt",
    category: "Action",
  },
  {
    id: 10,
    quote: "Discipline is choosing between what you want now and what you want most.",
    author: "Abraham Lincoln",
    category: "Discipline",
  },
  {
    id: 11,
    quote: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius",
    category: "Resilience",
  },
  {
    id: 12,
    quote: "Simplicity boils down to two steps: Identify the essential. Eliminate the rest.",
    author: "Leo Babauta",
    category: "Focus",
  },
  {
    id: 13,
    quote: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
    category: "Consistency",
  },
  {
    id: 14,
    quote: "Your future is created by what you do today, not tomorrow.",
    author: "Robert Kiyosaki",
    category: "Action",
  },
  {
    id: 15,
    quote: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
    category: "Resilience",
  },
  {
    id: 16,
    quote: "Mastering others is strength. Mastering yourself is true power.",
    author: "Lao Tzu",
    category: "Mindset",
  },
  {
    id: 17,
    quote: "Done is better than perfect.",
    author: "Sheryl Sandberg",
    category: "Action",
  },
  {
    id: 18,
    quote: "Energy flows where attention goes. Choose your focus with deliberate precision.",
    author: "Tony Robbins",
    category: "Focus",
  },
  {
    id: 19,
    quote: "A year from now you may wish you had started today.",
    author: "Karen Lamb",
    category: "Action",
  },
  {
    id: 20,
    quote: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
    category: "Mindset",
  },
  {
    id: 21,
    quote: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.",
    author: "Alexander Graham Bell",
    category: "Focus",
  },
  {
    id: 22,
    quote: "Either you run the day or the day runs you.",
    author: "Jim Rohn",
    category: "Discipline",
  },
  {
    id: 23,
    quote: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    category: "Action",
  },
  {
    id: 24,
    quote: "Patience and perseverance have a magical effect before which difficulties disappear and obstacles vanish.",
    author: "John Quincy Adams",
    category: "Resilience",
  },
  {
    id: 25,
    quote: "Great things are not done by impulse, but by a series of small things brought together.",
    author: "Vincent Van Gogh",
    category: "Consistency",
  },
  {
    id: 26,
    quote: "Deep work is the ability to focus without distraction on a cognitively demanding task.",
    author: "Cal Newport",
    category: "Focus",
  },
  {
    id: 27,
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "Mindset",
  },
  {
    id: 28,
    quote: "The most difficult thing is the decision to act; the rest is merely tenacity.",
    author: "Amelia Earhart",
    category: "Action",
  },
  {
    id: 29,
    quote: "Self-discipline begins with the mastery of your thoughts. If you don't control what you think, you can't control what you do.",
    author: "Napoleon Hill",
    category: "Discipline",
  },
  {
    id: 30,
    quote: "Do not wait to strike till the iron is hot; but make it hot by striking.",
    author: "William Butler Yeats",
    category: "Action",
  },
  {
    id: 31,
    quote: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche",
    category: "Resilience",
  },
  {
    id: 32,
    quote: "Continuous improvement is better than delayed perfection.",
    author: "Mark Twain",
    category: "Growth",
  },
  {
    id: 33,
    quote: "Every strike brings me closer to the next home run.",
    author: "Babe Ruth",
    category: "Resilience",
  },
  {
    id: 34,
    quote: "Start where you are. Use what you have. Do what you can.",
    author: "Arthur Ashe",
    category: "Action",
  },
  {
    id: 35,
    quote: "Champions keep playing until they get it right.",
    author: "Billie Jean King",
    category: "Consistency",
  },
  {
    id: 36,
    quote: "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success.",
    author: "Dwayne Johnson",
    category: "Consistency",
  },
];

/**
 * Returns a deterministic daily quote based on the given date string (YYYY-MM-DD).
 * The quote rotates each day predictably so the user gets a fresh quote every morning.
 */
export function getDailyQuote(dateStr?: string): DailyQuoteItem {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  
  // Hash the date string to an integer index
  let hash = 0;
  for (let i = 0; i < targetDate.length; i++) {
    hash = (hash << 5) - hash + targetDate.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  const positiveHash = Math.abs(hash);
  const index = positiveHash % PREDEFINED_QUOTES.length;
  return PREDEFINED_QUOTES[index];
}
