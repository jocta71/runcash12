
export interface Database {
  public: {
    Tables: {
      recent_numbers: {
        Row: {
          id: string;
          roulette_name: string;
          number: number;
          color: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          roulette_name: string;
          number: number;
          color: string;
          timestamp?: string;
        };
        Update: {
          id?: string;
          roulette_name?: string;
          number?: number;
          color?: string;
          timestamp?: string;
        };
      };
    };
  };
}
