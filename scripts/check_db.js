import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Checking connection...");
    const { data, error } = await supabase.from('projects').select('*').limit(1);

    if (error) {
        console.error("Error connecting or table missing:", error.message);
    } else {
        console.log("Success! Projects table found.");
    }
}

check();
