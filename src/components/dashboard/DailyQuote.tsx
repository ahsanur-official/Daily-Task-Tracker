import React from 'react';
import { Motivation } from './Motivation';

export interface DailyQuoteProps {
  todayDate?: string;
  className?: string;
}

/**
 * DailyQuote component - forwards directly to Motivation component
 */
export const DailyQuote: React.FC<DailyQuoteProps> = (props) => {
  return <Motivation {...props} />;
};

export default DailyQuote;
