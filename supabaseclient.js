// supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://nqqlsntgmorujffrntih.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWxzbnRnbW9ydGpmZnJudGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzE5OTQsImV4cCI6MjA3NTE0Nzk5NH0.d77RSXyoK-2rFvxAiJB4xgSYpXEHsTKCdF0A3RwzXwY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
