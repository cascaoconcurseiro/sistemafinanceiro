export interface SmartSuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
}

export const smartSuggestions = {
  getSuggestions: async (): Promise<SmartSuggestion[]> => {
    return [];
  }
};
