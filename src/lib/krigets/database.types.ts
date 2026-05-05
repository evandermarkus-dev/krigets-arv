// Auto-genererad från Supabase 2026-05-04
// Återskapa med: npx supabase gen types typescript --project-id glmyfsjoiepdsvmahfhr > src/lib/krigets/database.types.ts
// Behåll de manuella aliasen i slutet av filen när du regenererar.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      conflict_documents: {
        Row: {
          conflict_id: string
          created_at: string
          document_id: string
          relevance_score: number
          tagged_by: string
        }
        Insert: {
          conflict_id: string
          created_at?: string
          document_id: string
          relevance_score?: number
          tagged_by?: string
        }
        Update: {
          conflict_id?: string
          created_at?: string
          document_id?: string
          relevance_score?: number
          tagged_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "conflict_documents_conflict_id_fkey"
            columns: ["conflict_id"]
            isOneToOne: false
            referencedRelation: "conflict_meta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
        ]
      }
      conflict_events: {
        Row: {
          children_affected: boolean | null
          country: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          event_type: string | null
          id: string
          lat: number | null
          lng: number | null
          raw_url: string | null
          region: string | null
          source: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          children_affected?: boolean | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          raw_url?: string | null
          region?: string | null
          source: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          children_affected?: boolean | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          raw_url?: string | null
          region?: string | null
          source?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conflict_meta: {
        Row: {
          active: boolean
          created_at: string
          id: string
          lat: number
          lng: number
          name_en: string
          name_sv: string
          query_en: string
          query_sv: string
          severity: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id: string
          lat: number
          lng: number
          name_en: string
          name_sv: string
          query_en?: string
          query_sv?: string
          severity: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name_en?: string
          name_sv?: string
          query_en?: string
          query_sv?: string
          severity?: string
        }
        Relationships: []
      }
      conflict_stats: {
        Row: {
          arms: string | null
          conflict_id: string
          description: string | null
          locale: string
          sources: string[]
          stats: Json
          updated_at: string
        }
        Insert: {
          arms?: string | null
          conflict_id: string
          description?: string | null
          locale: string
          sources?: string[]
          stats?: Json
          updated_at?: string
        }
        Update: {
          arms?: string | null
          conflict_id?: string
          description?: string | null
          locale?: string
          sources?: string[]
          stats?: Json
          updated_at?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          doc_type: string | null
          domain: string
          id: string
          metadata: Json | null
          published_date: string | null
          scraped_at: string
          source_name: string
          title: string
          topics: string[] | null
          url: string
        }
        Insert: {
          doc_type?: string | null
          domain: string
          id?: string
          metadata?: Json | null
          published_date?: string | null
          scraped_at?: string
          source_name: string
          title: string
          topics?: string[] | null
          url: string
        }
        Update: {
          doc_type?: string | null
          domain?: string
          id?: string
          metadata?: Json | null
          published_date?: string | null
          scraped_at?: string
          source_name?: string
          title?: string
          topics?: string[] | null
          url?: string
        }
        Relationships: []
      }
      firecrawl_jobs: {
        Row: {
          completed_at: string | null
          conflict_id: string | null
          crawl_mode: string
          created_at: string
          documents_inserted: number
          error_message: string | null
          exclude_paths: string[] | null
          firecrawl_run_id: string | null
          id: string
          include_paths: string[] | null
          max_depth: number
          pages_failed: number
          pages_scraped: number
          source_domain: string
          started_at: string
          status: string
          url_pattern: string
        }
        Insert: {
          completed_at?: string | null
          conflict_id?: string | null
          crawl_mode?: string
          created_at?: string
          documents_inserted?: number
          error_message?: string | null
          exclude_paths?: string[] | null
          firecrawl_run_id?: string | null
          id?: string
          include_paths?: string[] | null
          max_depth?: number
          pages_failed?: number
          pages_scraped?: number
          source_domain: string
          started_at?: string
          status?: string
          url_pattern: string
        }
        Update: {
          completed_at?: string | null
          conflict_id?: string | null
          crawl_mode?: string
          created_at?: string
          documents_inserted?: number
          error_message?: string | null
          exclude_paths?: string[] | null
          firecrawl_run_id?: string | null
          id?: string
          include_paths?: string[] | null
          max_depth?: number
          pages_failed?: number
          pages_scraped?: number
          source_domain?: string
          started_at?: string
          status?: string
          url_pattern?: string
        }
        Relationships: [
          {
            foreignKeyName: "firecrawl_jobs_conflict_id_fkey"
            columns: ["conflict_id"]
            isOneToOne: false
            referencedRelation: "conflict_meta"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<never, never>
    Functions: {
      search_chunks: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          similarity: number
          source_name: string
          title: string
          url: string
        }[]
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

// =============================================================================
// Hjälptyper för enklare användning
// =============================================================================

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

// Aliaser för de viktigaste raderna
export type ConflictMeta = Tables<"conflict_meta">
export type ConflictStat = Tables<"conflict_stats">
export type ConflictEvent = Tables<"conflict_events">
export type Document = Tables<"documents">
export type DocumentChunk = Tables<"document_chunks">
export type ConflictDocument = Tables<"conflict_documents">
export type FirecrawlJob = Tables<"firecrawl_jobs">

// Domänspecifika unioner — håll synkat med CHECK-constraints i schemat
export type Severity = "critical" | "high"
export type Locale = "sv" | "en"
export type CrawlMode = "scrape" | "crawl" | "map"
export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled"
export type TaggedBy = "manual" | "classifier" | "crawl_target"
export type DocType =
  | "annual_report"
  | "press_release"
  | "news"
  | "sg_report"
  | "country_chapter"
  | "statement"
