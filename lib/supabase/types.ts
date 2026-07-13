// Générés à la main depuis supabase/migrations/001_init.sql.
// À terme : `supabase gen types typescript` remplacera ce fichier.

export type ChapterStatusDb =
  | "non_vu"
  | "lu"
  | "fiche"
  | "revise"
  | "maitrise";

export type QuestionTypeDb = "qcm" | "ouverte" | "mini_cas";
export type QuestionStateDb = "active" | "signalee";
export type DocumentStatusDb = "uploaded" | "generating" | "ready" | "error";
export type ReviewStateDb = "new" | "learning" | "review" | "relearning";

interface Table<Row, Insert> {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      subjects: Table<
        {
          id: string;
          user_id: string;
          slug: string;
          name: string;
          exam_date: string | null;
          exam_duration_min: number;
          has_chapters: boolean;
          sort_order: number;
        },
        {
          id?: string;
          user_id: string;
          slug: string;
          name: string;
          exam_date?: string | null;
          exam_duration_min: number;
          has_chapters?: boolean;
          sort_order?: number;
        }
      >;
      chapters: Table<
        {
          id: string;
          user_id: string;
          subject_id: string;
          name: string;
          pdf_ref: string | null;
          status: ChapterStatusDb;
          weight: number;
          program_week: number | null;
          sort_order: number;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          subject_id: string;
          name: string;
          pdf_ref?: string | null;
          status?: ChapterStatusDb;
          weight?: number;
          program_week?: number | null;
          sort_order?: number;
          updated_at?: string;
        }
      >;
      assignments: Table<
        {
          id: string;
          user_id: string;
          subject_id: string;
          week_number: number;
          title: string;
          pages: string | null;
          due_date: string;
          done_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          subject_id: string;
          week_number: number;
          title: string;
          pages?: string | null;
          due_date: string;
          done_at?: string | null;
        }
      >;
      status_events: Table<
        {
          id: string;
          user_id: string;
          chapter_id: string;
          from_status: ChapterStatusDb;
          to_status: ChapterStatusDb;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          chapter_id: string;
          from_status: ChapterStatusDb;
          to_status: ChapterStatusDb;
          created_at?: string;
        }
      >;
      milestones: Table<
        {
          id: string;
          user_id: string;
          subject_id: string | null;
          title: string;
          due_date: string;
          done_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          subject_id?: string | null;
          title: string;
          due_date: string;
          done_at?: string | null;
        }
      >;
      synthesis_logs: Table<
        {
          id: string;
          user_id: string;
          trained_on: string;
          duration_min: number;
          annale_ref: string | null;
          feeling: number | null;
          comment: string | null;
        },
        {
          id?: string;
          user_id: string;
          trained_on?: string;
          duration_min: number;
          annale_ref?: string | null;
          feeling?: number | null;
          comment?: string | null;
        }
      >;
      documents: Table<
        {
          id: string;
          user_id: string;
          subject_id: string;
          chapter_id: string | null;
          storage_path: string;
          filename: string;
          anthropic_file_id: string | null;
          status: DocumentStatusDb;
          error_message: string | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          subject_id: string;
          chapter_id?: string | null;
          storage_path: string;
          filename: string;
          anthropic_file_id?: string | null;
          status?: DocumentStatusDb;
          error_message?: string | null;
          created_at?: string;
        }
      >;
      questions: Table<
        {
          id: string;
          user_id: string;
          chapter_id: string;
          document_id: string | null;
          qtype: QuestionTypeDb;
          payload: unknown;
          status: QuestionStateDb;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          chapter_id: string;
          document_id?: string | null;
          qtype: QuestionTypeDb;
          payload: unknown;
          status?: QuestionStateDb;
          created_at?: string;
        }
      >;
      question_reviews: Table<
        {
          id: string;
          user_id: string;
          question_id: string;
          state: ReviewStateDb;
          stability: number;
          difficulty: number;
          reps: number;
          lapses: number;
          last_rating: number | null;
          due_at: string;
          last_reviewed_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          question_id: string;
          state?: ReviewStateDb;
          stability?: number;
          difficulty?: number;
          reps?: number;
          lapses?: number;
          last_rating?: number | null;
          due_at?: string;
          last_reviewed_at?: string | null;
        }
      >;
      question_attempts: Table<
        {
          id: string;
          user_id: string;
          session_id: string | null;
          question_id: string;
          rating: number;
          answered_at: string;
        },
        {
          id?: string;
          user_id: string;
          session_id?: string | null;
          question_id: string;
          rating: number;
          answered_at?: string;
        }
      >;
      quiz_sessions: Table<
        {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          answered: number;
          correct: number;
        },
        {
          id?: string;
          user_id: string;
          started_at?: string;
          ended_at?: string | null;
          answered?: number;
          correct?: number;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
