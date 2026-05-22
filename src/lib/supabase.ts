import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Real Supabase client fallback
export const realSupabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local event target for real-time notifications
const changeEventTarget = new EventTarget();

export function notifyTableChange(table: string) {
  changeEventTarget.dispatchEvent(new CustomEvent('change', { detail: { table } }));
}

// Custom mock Supabase client that routes to Express/SQLite API
export const supabase = {
  auth: {
    getSession: async () => {
      if (realSupabase) {
        try {
          return await realSupabase.auth.getSession();
        } catch (e) {
          // ignore and fallback
        }
      }
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      if (realSupabase) {
        return realSupabase.auth.onAuthStateChange(callback);
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async (credentials: any) => {
      if (realSupabase) {
        try {
          return await realSupabase.auth.signInWithPassword(credentials);
        } catch (e: any) {
          return { data: null, error: e };
        }
      }
      return { data: null, error: { message: 'Supabase auth not configured' } };
    },
    signInWithOAuth: async (options: any) => {
      if (realSupabase) {
        return await realSupabase.auth.signInWithOAuth(options);
      }
      return { data: null, error: { message: 'Supabase auth not configured' } };
    },
    signOut: async () => {
      if (realSupabase) {
        return await realSupabase.auth.signOut();
      }
      return { error: null };
    }
  },

  from(table: string) {
    let operation = 'select'; // 'select' | 'insert' | 'update' | 'delete'
    let recordsToInsert: any = null;
    let fieldsToUpdate: any = null;
    let selectFields = '*';
    let countOption = null;
    let filters: Array<{ type: string; field: string; value: any }> = [];
    let orderField = '';
    let orderAscending = true;
    let limitValue: number | null = null;

    const queryBuilder: any = {
      select(fields = '*', options: any = {}) {
        operation = 'select';
        selectFields = fields;
        if (options && options.count) {
          countOption = options.count;
        }
        return this;
      },
      insert(records: any) {
        operation = 'insert';
        recordsToInsert = records;
        return this;
      },
      update(fields: any) {
        operation = 'update';
        fieldsToUpdate = fields;
        return this;
      },
      delete() {
        operation = 'delete';
        return this;
      },
      eq(field: string, value: any) {
        filters.push({ type: 'eq', field, value });
        return this;
      },
      gte(field: string, value: any) {
        filters.push({ type: 'gte', field, value });
        return this;
      },
      lte(field: string, value: any) {
        filters.push({ type: 'lte', field, value });
        return this;
      },
      order(field: string, options: any = {}) {
        orderField = field;
        orderAscending = options.ascending !== false;
        return this;
      },
      limit(value: number) {
        limitValue = value;
        return this;
      },

      // Thenable execution for await calls
      then: async (resolve: any, reject: any) => {
        try {
          if (operation === 'select') {
            let url = `/api/${table}`;
            const params = new URLSearchParams();
            
            filters.forEach(f => {
              if (f.field === 'date') {
                if (f.type === 'eq') params.append('date', f.value);
                if (f.type === 'gte') params.append('startDate', f.value);
                if (f.type === 'lte') params.append('endDate', f.value);
              }
              if (f.field === 'staffId' && f.type === 'eq') {
                params.append('staffId', f.value);
              }
            });

            if (limitValue) {
              params.append('limit', limitValue.toString());
            }

            const queryString = params.toString();
            if (queryString) {
              url += `?${queryString}`;
            }

            const res = await fetch(url);
            const json = await res.json();

            let data = json.data;
            
            // Local filter fallback
            filters.forEach(f => {
              if (!data) return;
              if (f.type === 'eq') {
                data = data.filter((item: any) => item[f.field] === f.value);
              } else if (f.type === 'gte') {
                data = data.filter((item: any) => item[f.field] >= f.value);
              } else if (f.type === 'lte') {
                data = data.filter((item: any) => item[f.field] <= f.value);
              }
            });

            // Local sorting fallback
            if (orderField && data) {
              data = [...data].sort((a: any, b: any) => {
                const valA = a[orderField];
                const valB = b[orderField];
                if (valA < valB) return orderAscending ? -1 : 1;
                if (valA > valB) return orderAscending ? 1 : -1;
                return 0;
              });
            }

            // Local limit fallback
            if (limitValue && data) {
              data = data.slice(0, limitValue);
            }

            let response: any = { data, error: json.error };

            if (countOption && data) {
              response.count = data.length;
            }

            resolve(response);
          } 
          
          else if (operation === 'insert') {
            const isArray = Array.isArray(recordsToInsert);
            const array = isArray ? recordsToInsert : [recordsToInsert];
            const results = [];
            
            for (const record of array) {
              const res = await fetch(`/api/${table}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
              });
              const json = await res.json();
              if (json.error) throw new Error(json.error.message);
              results.push(json.data);
            }

            notifyTableChange(table);
            resolve({ data: isArray ? results : results[0], error: null });
          } 
          
          else if (operation === 'update') {
            const idFilter = filters.find(f => f.field === 'id' && f.type === 'eq');
            if (!idFilter) {
              throw new Error('Update query requires an ID filter');
            }
            
            const res = await fetch(`/api/${table}/${idFilter.value}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fieldsToUpdate)
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error.message);
            
            notifyTableChange(table);
            resolve({ data: json.data, error: null });
          } 
          
          else if (operation === 'delete') {
            const idFilter = filters.find(f => f.field === 'id' && f.type === 'eq');
            if (idFilter) {
              const res = await fetch(`/api/${table}/${idFilter.value}`, {
                method: 'DELETE'
              });
              const json = await res.json();
              if (json.error) throw new Error(json.error.message);
              
              notifyTableChange(table);
              resolve({ data: null, error: null });
              return;
            }

            const params = new URLSearchParams();
            filters.forEach(f => {
              params.append(f.field, f.value);
            });
            
            const res = await fetch(`/api/${table}?${params.toString()}`, {
              method: 'DELETE'
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error.message);
            
            notifyTableChange(table);
            resolve({ data: null, error: null });
          }
        } catch (err: any) {
          resolve({ data: null, error: { message: err.message } });
        }
      }
    };

    return queryBuilder;
  },

  channel(name: string) {
    return {
      on(event: string, filter: any, callback: () => void) {
        const listener = (e: any) => {
          if (e.detail.table === filter.table) {
            callback();
          }
        };
        changeEventTarget.addEventListener('change', listener);
        return {
          subscribe() {
            return {
              unsubscribe() {
                changeEventTarget.removeEventListener('change', listener);
              }
            };
          }
        };
      }
    };
  },

  removeChannel(channel: any) {
    if (channel && channel.unsubscribe) {
      channel.unsubscribe();
    }
  }
};
