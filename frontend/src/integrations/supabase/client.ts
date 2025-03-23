/**
 * Mock do cliente Supabase para remover a dependência da biblioteca
 * Essa versão mock tem os métodos necessários sem fazer chamadas reais ao Supabase
 */

// Definição de tipos para o mock
type MockSubscriptionCallback = (payload: any) => void;

// Cliente Supabase mock
export const supabase = {
  // Auth mock methods
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signUp: () => Promise.resolve({ data: {}, error: null }),
    signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
    signInWithOAuth: () => Promise.resolve({ data: {}, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  
  // Database mock methods
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        order: (column: string, { ascending = true } = {}) => ({
          limit: (limit: number) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            then: (callback: any) => Promise.resolve({ data: [], error: null }).then(callback),
          }),
        }),
      }),
      order: (column: string, { ascending = true } = {}) => ({
        limit: (limit: number) => Promise.resolve({ data: [], error: null }),
      }),
    }),
    insert: (data: any) => Promise.resolve({ data: {}, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: {}, error: null }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: {}, error: null }),
    }),
  }),
  
  // Realtime mock methods
  channel: (name: string) => ({
    on: (event: string, filter: any, callback: MockSubscriptionCallback) => ({
      subscribe: (statusCallback?: (status: string) => void) => {
        if (statusCallback) statusCallback('SUBSCRIBED');
        return {
          unsubscribe: () => {}
        };
      },
    }),
  }),
  
  // Storage mock methods
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: File) => Promise.resolve({ data: {}, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
    }),
  },
};

export default supabase;
