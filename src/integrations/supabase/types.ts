export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcement_recipients: {
        Row: {
          announcement_id: string
          created_at: string
          delivered_at: string | null
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_recipients_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          announcement_type: string
          created_at: string
          created_by: string
          id: string
          message: string
          metadata: Json | null
          scheduled_for: string | null
          send_as_email: boolean | null
          send_as_notification: boolean | null
          sent_at: string | null
          status: string
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          announcement_type: string
          created_at?: string
          created_by: string
          id?: string
          message: string
          metadata?: Json | null
          scheduled_for?: string | null
          send_as_email?: boolean | null
          send_as_notification?: boolean | null
          sent_at?: string | null
          status?: string
          target_audience: string
          title: string
          updated_at?: string
        }
        Update: {
          announcement_type?: string
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          metadata?: Json | null
          scheduled_for?: string | null
          send_as_email?: boolean | null
          send_as_notification?: boolean | null
          sent_at?: string | null
          status?: string
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_requests: {
        Row: {
          coaching_name: string
          coaching_type: string
          created_at: string | null
          email: string
          id: string
          phone: string
          status: string
          student_count: string | null
          updated_at: string | null
        }
        Insert: {
          coaching_name: string
          coaching_type?: string
          created_at?: string | null
          email: string
          id?: string
          phone: string
          status?: string
          student_count?: string | null
          updated_at?: string | null
        }
        Update: {
          coaching_name?: string
          coaching_type?: string
          created_at?: string | null
          email?: string
          id?: string
          phone?: string
          status?: string
          student_count?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          mentor_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          mentor_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          mentor_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      earnings: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          mentor_id: string
          paid_at: string | null
          session_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          mentor_id: string
          paid_at?: string | null
          session_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          mentor_id?: string
          paid_at?: string | null
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "earnings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_availability: {
        Row: {
          created_at: string | null
          date: string
          duration_minutes: number
          end_time: string
          google_meet_link: string | null
          held_until: string | null
          id: string
          mentor_id: string
          start_time: string
          status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          duration_minutes?: number
          end_time: string
          google_meet_link?: string | null
          held_until?: string | null
          id?: string
          mentor_id: string
          start_time: string
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          duration_minutes?: number
          end_time?: string
          google_meet_link?: string | null
          held_until?: string | null
          id?: string
          mentor_id?: string
          start_time?: string
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_availability_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_category_prices: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          mentor_id: string
          price_per_15m: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mentor_id: string
          price_per_15m?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mentor_id?: string
          price_per_15m?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_category_prices_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_price_requests: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string | null
          current_price: number
          id: string
          mentor_id: string
          message: string | null
          requested_price: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string | null
          current_price?: number
          id?: string
          mentor_id: string
          message?: string | null
          requested_price: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string | null
          current_price?: number
          id?: string
          mentor_id?: string
          message?: string | null
          requested_price?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_price_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_price_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          allow_rate_edit: boolean | null
          bank_account: string | null
          bio: string | null
          created_at: string | null
          documents_urls: string[] | null
          exams: string[] | null
          fixed_rate_per_15m: number | null
          fixed_rate_per_30m: number | null
          fixed_rate_per_45m: number | null
          id: string
          mentor_types: string[] | null
          nickname: string | null
          paid_balance: number | null
          piece_of_proof_url: string | null
          qualifications: string[] | null
          rating: number | null
          reschedule_policy: Json | null
          specialization: string | null
          status: string | null
          timezone: string | null
          total_earnings: number | null
          total_sessions: number | null
          updated_at: string | null
          upi_id: string | null
          user_id: string
          verification_expires_at: string | null
          verification_token: string | null
          wallet_balance: number | null
        }
        Insert: {
          allow_rate_edit?: boolean | null
          bank_account?: string | null
          bio?: string | null
          created_at?: string | null
          documents_urls?: string[] | null
          exams?: string[] | null
          fixed_rate_per_15m?: number | null
          fixed_rate_per_30m?: number | null
          fixed_rate_per_45m?: number | null
          id?: string
          mentor_types?: string[] | null
          nickname?: string | null
          paid_balance?: number | null
          piece_of_proof_url?: string | null
          qualifications?: string[] | null
          rating?: number | null
          reschedule_policy?: Json | null
          specialization?: string | null
          status?: string | null
          timezone?: string | null
          total_earnings?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          upi_id?: string | null
          user_id: string
          verification_expires_at?: string | null
          verification_token?: string | null
          wallet_balance?: number | null
        }
        Update: {
          allow_rate_edit?: boolean | null
          bank_account?: string | null
          bio?: string | null
          created_at?: string | null
          documents_urls?: string[] | null
          exams?: string[] | null
          fixed_rate_per_15m?: number | null
          fixed_rate_per_30m?: number | null
          fixed_rate_per_45m?: number | null
          id?: string
          mentor_types?: string[] | null
          nickname?: string | null
          paid_balance?: number | null
          piece_of_proof_url?: string | null
          qualifications?: string[] | null
          rating?: number | null
          reschedule_policy?: Json | null
          specialization?: string | null
          status?: string | null
          timezone?: string | null
          total_earnings?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          upi_id?: string | null
          user_id?: string
          verification_expires_at?: string | null
          verification_token?: string | null
          wallet_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mentors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action_taken: string | null
          context: string | null
          created_at: string | null
          detected_content: string | null
          detected_type: string | null
          id: string
          reviewed_by_admin: boolean | null
          session_id: string | null
        }
        Insert: {
          action_taken?: string | null
          context?: string | null
          created_at?: string | null
          detected_content?: string | null
          detected_type?: string | null
          id?: string
          reviewed_by_admin?: boolean | null
          session_id?: string | null
        }
        Update: {
          action_taken?: string | null
          context?: string | null
          created_at?: string | null
          detected_content?: string | null
          detected_type?: string | null
          id?: string
          reviewed_by_admin?: boolean | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          receive_offers: boolean
          receive_session_reminders: boolean
          receive_system_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          receive_offers?: boolean
          receive_session_reminders?: boolean
          receive_system_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          receive_offers?: boolean
          receive_session_reminders?: boolean
          receive_system_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean | null
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          attempts: number | null
          blocked_until: string | null
          contact: string
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          last_sent_at: string | null
          max_attempts: number | null
          otp_hash: string
          purpose: string | null
          resend_count: number | null
          status: string | null
          type: string
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          blocked_until?: string | null
          contact: string
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          last_sent_at?: string | null
          max_attempts?: number | null
          otp_hash: string
          purpose?: string | null
          resend_count?: number | null
          status?: string | null
          type: string
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          blocked_until?: string | null
          contact?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_sent_at?: string | null
          max_attempts?: number | null
          otp_hash?: string
          purpose?: string | null
          resend_count?: number | null
          status?: string | null
          type?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          session_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          session_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          session_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          id: string
          mentor_id: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          id?: string
          mentor_id: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          id?: string
          mentor_id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      pg_stat_statements_report: {
        Row: {
          calls: number | null
          mean_exec_time: number | null
          mean_plan_time: number | null
          query: string | null
          recorded_at: string | null
          rows: number | null
          total_exec_time: number | null
          total_plan_time: number | null
        }
        Insert: {
          calls?: number | null
          mean_exec_time?: number | null
          mean_plan_time?: number | null
          query?: string | null
          recorded_at?: string | null
          rows?: number | null
          total_exec_time?: number | null
          total_plan_time?: number | null
        }
        Update: {
          calls?: number | null
          mean_exec_time?: number | null
          mean_plan_time?: number | null
          query?: string | null
          recorded_at?: string | null
          rows?: number | null
          total_exec_time?: number | null
          total_plan_time?: number | null
        }
        Relationships: []
      }
      plan_mentor_prices: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          mentor_id: string
          plan_id: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          mentor_id: string
          plan_id: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          mentor_id?: string
          plan_id?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_mentor_prices_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_mentor_prices_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration_minutes: number
          features: Json
          id: string
          is_active: boolean | null
          name: string
          plan_key: string
          sort_order: number | null
          strategy_mode: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          features?: Json
          id?: string
          is_active?: boolean | null
          name: string
          plan_key: string
          sort_order?: number | null
          strategy_mode: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          features?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          plan_key?: string
          sort_order?: number | null
          strategy_mode?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academic_category: string | null
          avatar_url: string | null
          board: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          login_count: number | null
          password_enabled: boolean
          phone: string | null
          purpose: string | null
          referral_code: string | null
          referred_by: string | null
          referred_by_partner_id: string | null
          requires_password_set: boolean | null
          status: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          academic_category?: string | null
          avatar_url?: string | null
          board?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          login_count?: number | null
          password_enabled?: boolean
          phone?: string | null
          purpose?: string | null
          referral_code?: string | null
          referred_by?: string | null
          referred_by_partner_id?: string | null
          requires_password_set?: boolean | null
          status?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          academic_category?: string | null
          avatar_url?: string | null
          board?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          login_count?: number | null
          password_enabled?: boolean
          phone?: string | null
          purpose?: string | null
          referral_code?: string | null
          referred_by?: string | null
          referred_by_partner_id?: string | null
          requires_password_set?: boolean | null
          status?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_partner_id_fkey"
            columns: ["referred_by_partner_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_partner_id_fkey"
            columns: ["referred_by_partner_id"]
            isOneToOne: false
            referencedRelation: "public_promoter_lookup"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          body: string | null
          created_at: string | null
          file_path: string | null
          id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      promoter_payouts: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          paid_at: string | null
          promoter_id: string | null
          status: string | null
          tx_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          promoter_id?: string | null
          status?: string | null
          tx_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          promoter_id?: string | null
          status?: string | null
          tx_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_payouts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_payouts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "public_promoter_lookup"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string | null
          short_ref: string
          total_clicks: number | null
          total_earnings: number | null
          total_sessions: number | null
          total_signups: number | null
          upi_id: string | null
          user_id: string | null
        }
        Insert: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string | null
          short_ref?: string
          total_clicks?: number | null
          total_earnings?: number | null
          total_sessions?: number | null
          total_signups?: number | null
          upi_id?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string | null
          short_ref?: string
          total_clicks?: number | null
          total_earnings?: number | null
          total_sessions?: number | null
          total_signups?: number | null
          upi_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          created_at: string | null
          id: string
          ip: string | null
          promoter_id: string | null
          short_ref: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip?: string | null
          promoter_id?: string | null
          short_ref: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip?: string | null
          promoter_id?: string | null
          short_ref?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_clicks_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "public_promoter_lookup"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_discounts: {
        Row: {
          created_at: string | null
          discount_amount: number
          final_price: number
          id: string
          original_price: number
          promoter_id: string | null
          referral_code: string
          session_id: string | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number
          final_price: number
          id?: string
          original_price: number
          promoter_id?: string | null
          referral_code: string
          session_id?: string | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          discount_amount?: number
          final_price?: number
          id?: string
          original_price?: number
          promoter_id?: string | null
          referral_code?: string
          session_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_discounts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_discounts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "public_promoter_lookup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_discounts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_earned: number | null
          created_at: string | null
          id: string
          last_commission_session_id: string | null
          promoter_id: string | null
          referred_user_id: string
          sessions_count: number | null
        }
        Insert: {
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          last_commission_session_id?: string | null
          promoter_id?: string | null
          referred_user_id: string
          sessions_count?: number | null
        }
        Update: {
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          last_commission_session_id?: string | null
          promoter_id?: string | null
          referred_user_id?: string
          sessions_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_last_commission_session_id_fkey"
            columns: ["last_commission_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "public_promoter_lookup"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          is_flagged: boolean | null
          mentor_id: string
          rating: number
          review_text: string | null
          session_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          mentor_id: string
          rating: number
          review_text?: string | null
          session_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          mentor_id?: string
          rating?: number
          review_text?: string | null
          session_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          amount_paid: number | null
          call_duration: number | null
          call_ended_at: string | null
          call_started_at: string | null
          category: string | null
          chat_access_enabled: boolean | null
          completed_at: string | null
          created_at: string | null
          google_calendar_event_id: string | null
          google_meet_link: string | null
          id: string
          last_rescheduled_at: string | null
          manual_assign_required: boolean | null
          mentor_assigned_at: string | null
          mentor_connected: boolean | null
          mentor_earning: number | null
          mentor_id: string
          payment_id: string | null
          payment_status_confirmed: boolean
          plan_id: string | null
          plan_type: string | null
          platform_fee: number | null
          pre_session_brief: Json | null
          program_started: boolean | null
          reschedule_count: number | null
          reschedule_fee: number | null
          scheduled_at: string | null
          slot_id: string | null
          status: string | null
          strategy_mode: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          call_duration?: number | null
          call_ended_at?: string | null
          call_started_at?: string | null
          category?: string | null
          chat_access_enabled?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          google_calendar_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          last_rescheduled_at?: string | null
          manual_assign_required?: boolean | null
          mentor_assigned_at?: string | null
          mentor_connected?: boolean | null
          mentor_earning?: number | null
          mentor_id: string
          payment_id?: string | null
          payment_status_confirmed?: boolean
          plan_id?: string | null
          plan_type?: string | null
          platform_fee?: number | null
          pre_session_brief?: Json | null
          program_started?: boolean | null
          reschedule_count?: number | null
          reschedule_fee?: number | null
          scheduled_at?: string | null
          slot_id?: string | null
          status?: string | null
          strategy_mode?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          call_duration?: number | null
          call_ended_at?: string | null
          call_started_at?: string | null
          category?: string | null
          chat_access_enabled?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          google_calendar_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          last_rescheduled_at?: string | null
          manual_assign_required?: boolean | null
          mentor_assigned_at?: string | null
          mentor_connected?: boolean | null
          mentor_earning?: number | null
          mentor_id?: string
          payment_id?: string | null
          payment_status_confirmed?: boolean
          plan_id?: string | null
          plan_type?: string | null
          platform_fee?: number | null
          pre_session_brief?: Json | null
          program_started?: boolean | null
          reschedule_count?: number | null
          reschedule_fee?: number | null
          scheduled_at?: string | null
          slot_id?: string | null
          status?: string | null
          strategy_mode?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "mentor_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings_history: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_value: Json | null
          old_value: Json | null
          setting_key: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          setting_key: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          setting_key?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          responded_at: string | null
          responded_by: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_user_id: string
          referrer_id: string
          reward_claimed: boolean | null
          session_booked: boolean | null
          session_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_user_id: string
          referrer_id: string
          reward_claimed?: boolean | null
          session_booked?: boolean | null
          session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_user_id?: string
          referrer_id?: string
          reward_claimed?: boolean | null
          session_booked?: boolean | null
          session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_referrals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_promoter_lookup: {
        Row: {
          code: string | null
          id: string | null
          name: string | null
          short_ref: string | null
        }
        Insert: {
          code?: string | null
          id?: string | null
          name?: string | null
          short_ref?: string | null
        }
        Update: {
          code?: string | null
          id?: string | null
          name?: string | null
          short_ref?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_referral_discount: {
        Args: { user_id: string }
        Returns: {
          current_discount_percent: number
          free_sessions_available: number
          free_sessions_earned: number
          free_sessions_used: number
          successful_referrals: number
          total_referrals: number
        }[]
      }
      cleanup_pg_stat_statements_report: { Args: never; Returns: undefined }
      create_partner_profile: { Args: { p_name: string }; Returns: undefined }
      create_session_reminders: { Args: never; Returns: undefined }
      generate_user_referral_code: { Args: never; Returns: string }
      get_all_public_mentor_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          exams: string[]
          fixed_rate_per_15m: number
          fixed_rate_per_30m: number
          fixed_rate_per_45m: number
          full_name: string
          id: string
          mentor_id: string
          mentor_status: string
          mentor_types: string[]
          qualifications: string[]
          rating: number
          specialization: string
          total_sessions: number
          username: string
        }[]
      }
      get_all_referrals_admin: {
        Args: never
        Returns: {
          booked_sessions: number
          commission_earned: number
          completed_sessions: number
          promoter_code: string
          promoter_id: string
          promoter_name: string
          referral_date: string
          referral_id: string
          referred_user_id: string
          sessions_count: number
          student_category: string
          student_email: string
          student_name: string
          student_phone: string
          total_session_amount: number
        }[]
      }
      get_or_create_notification_preferences: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          id: string
          receive_offers: boolean
          receive_session_reminders: boolean
          receive_system_updates: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_promoter_earnings_summary: {
        Args: { p_promoter_id: string }
        Returns: {
          month_earnings: number
          pending_sessions: number
          today_earnings: number
          total_earnings: number
          week_earnings: number
        }[]
      }
      get_promoter_referral_sessions: {
        Args: { p_promoter_id: string }
        Returns: {
          amount_paid: number
          commission_amount: number
          mentor_name: string
          referral_id: string
          scheduled_at: string
          session_id: string
          status: string
          student_id: string
          student_name: string
        }[]
      }
      get_promoter_referrals: {
        Args: { p_promoter_id: string }
        Returns: {
          commission_earned: number
          referral_date: string
          referral_id: string
          referred_user_id: string
          sessions_count: number
          student_category: string
          student_email: string
          student_name: string
          student_phone: string
          total_booked_sessions: number
          total_completed_sessions: number
          total_session_amount: number
        }[]
      }
      get_public_mentor_by_id: {
        Args: { mentor_uuid: string }
        Returns: {
          avatar_url: string
          bio: string
          exams: string[]
          fixed_rate_per_15m: number
          fixed_rate_per_30m: number
          fixed_rate_per_45m: number
          full_name: string
          mentor_id: string
          mentor_status: string
          mentor_types: string[]
          nickname: string
          piece_of_proof_url: string
          qualifications: string[]
          rating: number
          specialization: string
          total_sessions: number
          user_id: string
          username: string
        }[]
      }
      get_public_mentors: {
        Args: never
        Returns: {
          bio: string
          exams: string[]
          fixed_rate_per_15m: number
          mentor_id: string
          mentor_status: string
          mentor_types: string[]
          nickname: string
          qualifications: string[]
          rating: number
          specialization: string
          total_sessions: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_promoter_by_ref: {
        Args: { ref_code: string }
        Returns: {
          code: string
          id: string
          name: string
          short_ref: string
        }[]
      }
      notify_all_admins: {
        Args: {
          metadata_json?: Json
          notification_message: string
          notification_title: string
          notification_type: string
        }
        Returns: undefined
      }
      snapshot_pg_stat_statements: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "student" | "mentor" | "admin" | "partner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "mentor", "admin", "partner"],
    },
  },
} as const
