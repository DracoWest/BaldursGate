import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ncabqfosmehmfemqmruo.supabase.co';
const supabaseAnonKey = 'sb_publishable_CJofvGKeVr0RsNtGMUtIXg_BeK3Y-gm';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
