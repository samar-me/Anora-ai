const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabase = null;

try {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    supabase = createClient(url, key);
  }
} catch (e) {
  console.warn('Supabase initialization skipped:', e.message);
}

async function syncTransaction({ type, amount, category, description, date }) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('transactions').insert({
      type,
      amount,
      currency: 'UZS',
      category: category || 'other',
      description: description || category || 'xarajat',
      transaction_date: date || new Date().toISOString().substring(0, 10),
    }).select().single();
    if (error) console.warn('Supabase transaction sync notice:', error.message);
    return data;
  } catch (err) {
    console.warn('Supabase sync error (ignored):', err.message);
    return null;
  }
}

function mapPriority(p) {
  if (!p) return 'medium';
  const s = String(p).toLowerCase();
  if (s.includes('shoshilinch') || s.includes('urgent')) return 'urgent';
  if (s.includes('muhim') || s.includes('high')) return 'high';
  if (s.includes('oddiy') || s.includes('low')) return 'low';
  return 'medium';
}

async function syncTask({ title, priority, due_date, due_time }) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('tasks').insert({
      title,
      priority: mapPriority(priority),
      due_date: due_date || new Date().toISOString().substring(0, 10),
      due_time: due_time || null,
      status: 'pending',
    }).select().single();
    if (error) console.warn('Supabase task sync notice:', error.message);
    return data;
  } catch (err) {
    console.warn('Supabase sync error (ignored):', err.message);
    return null;
  }
}

module.exports = {
  syncTransaction,
  syncTask,
};
