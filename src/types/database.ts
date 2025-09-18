export interface Database {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          created_by: string;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
          is_active?: boolean;
        };
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_text: string;
          options: string[];
          correct_answer: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_text: string;
          options: string[];
          correct_answer: string;
          order_index: number;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question_text?: string;
          options?: string[];
          correct_answer?: string;
          order_index?: number;
        };
      };
      responses: {
        Row: {
          id: string;
          quiz_id: string;
          student_name: string;
          student_email: string;
          student_register_number: string;
          answers: string[];
          score: number;
          total_questions: number;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          student_name: string;
          student_email: string;
          student_register_number: string;
          answers: string[];
          score: number;
          total_questions: number;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          student_name?: string;
          student_email?: string;
          student_register_number?: string;
          answers?: string[];
          score?: number;
          total_questions?: number;
          submitted_at?: string;
        };
      };
    };
  };
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  is_active: boolean;
  questions?: Question[];
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  order_index: number;
}

export interface Response {
  id: string;
  quiz_id: string;
  student_name: string;
  student_email: string;
  student_register_number: string;
  answers: string[];
  score: number;
  total_questions: number;
  submitted_at: string;
}