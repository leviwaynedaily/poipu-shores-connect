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
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          author_id: string
          channel_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_private: boolean | null
          recipient_id: string | null
          reply_to: string | null
        }
        Insert: {
          author_id: string
          channel_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_private?: boolean | null
          recipient_id?: string | null
          reply_to?: string | null
        }
        Update: {
          author_id?: string
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_private?: boolean | null
          recipient_id?: string | null
          reply_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      community_assistant_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_assistant_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "community_assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_photos: {
        Row: {
          camera_make: string | null
          camera_model: string | null
          caption: string | null
          category: string
          created_at: string
          date_taken: string | null
          exif_data: Json | null
          file_path: string
          file_size: number | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          is_approved: boolean
          likes_count: number
          location: string | null
          title: string
          uploaded_by: string
        }
        Insert: {
          camera_make?: string | null
          camera_model?: string | null
          caption?: string | null
          category?: string
          created_at?: string
          date_taken?: string | null
          exif_data?: Json | null
          file_path: string
          file_size?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          is_approved?: boolean
          likes_count?: number
          location?: string | null
          title: string
          uploaded_by: string
        }
        Update: {
          camera_make?: string | null
          camera_model?: string | null
          caption?: string | null
          category?: string
          created_at?: string
          date_taken?: string | null
          exif_data?: Json | null
          file_path?: string
          file_size?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          is_approved?: boolean
          likes_count?: number
          location?: string | null
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string
          content: string | null
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          folder: string | null
          folder_id: string | null
          id: string
          title: string
          unit_number: string | null
          uploaded_by: string
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          folder_id?: string | null
          id?: string
          title: string
          unit_number?: string | null
          uploaded_by: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          folder_id?: string | null
          id?: string
          title?: string
          unit_number?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bounce_reason: string | null
          bounced_at: string | null
          clicked_at: string | null
          complained_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_status: string | null
          error_message: string | null
          from_email: string
          id: string
          opened_at: string | null
          resend_email_id: string | null
          sent_at: string
          sent_by: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          bounce_reason?: string | null
          bounced_at?: string | null
          clicked_at?: string | null
          complained_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          from_email: string
          id?: string
          opened_at?: string | null
          resend_email_id?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          bounce_reason?: string | null
          bounced_at?: string | null
          clicked_at?: string | null
          complained_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          from_email?: string
          id?: string
          opened_at?: string | null
          resend_email_id?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          parent_folder_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          parent_folder_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          browser: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          location_city: string | null
          location_country: string | null
          logged_in_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          location_city?: string | null
          location_country?: string | null
          logged_in_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          location_city?: string | null
          location_country?: string | null
          logged_in_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          announcements_enabled: boolean | null
          chat_enabled: boolean | null
          created_at: string | null
          documents_enabled: boolean | null
          id: string
          photos_enabled: boolean | null
          sound_enabled: boolean | null
          updated_at: string | null
          user_id: string
          vibration_enabled: boolean | null
        }
        Insert: {
          announcements_enabled?: boolean | null
          chat_enabled?: boolean | null
          created_at?: string | null
          documents_enabled?: boolean | null
          id?: string
          photos_enabled?: boolean | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          vibration_enabled?: boolean | null
        }
        Update: {
          announcements_enabled?: boolean | null
          chat_enabled?: boolean | null
          created_at?: string | null
          documents_enabled?: boolean | null
          id?: string
          photos_enabled?: boolean | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          vibration_enabled?: boolean | null
        }
        Relationships: []
      }
      pending_invites: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          full_name: string
          id: string
          token: string
          unit_number: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          full_name: string
          id?: string
          token: string
          unit_number?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          token?: string
          unit_number?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      photo_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          photo_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          photo_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "community_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_likes: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "community_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_page_opacity: number | null
          avatar_url: string | null
          created_at: string
          deactivated_at: string | null
          deactivation_reason: string | null
          full_name: string
          glass_intensity: number | null
          glass_theme_enabled: boolean
          id: string
          is_active: boolean
          last_sign_in_at: string | null
          onboarding_completed: boolean | null
          phone: string | null
          show_contact_info: boolean
          sidebar_opacity: number | null
          updated_at: string
        }
        Insert: {
          auth_page_opacity?: number | null
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivation_reason?: string | null
          full_name: string
          glass_intensity?: number | null
          glass_theme_enabled?: boolean
          id: string
          is_active?: boolean
          last_sign_in_at?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          show_contact_info?: boolean
          sidebar_opacity?: number | null
          updated_at?: string
        }
        Update: {
          auth_page_opacity?: number | null
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivation_reason?: string | null
          full_name?: string
          glass_intensity?: number | null
          glass_theme_enabled?: boolean
          id?: string
          is_active?: boolean
          last_sign_in_at?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          show_contact_info?: boolean
          sidebar_opacity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          device_type: string | null
          id: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      unit_owners: {
        Row: {
          created_at: string | null
          id: string
          is_primary_contact: boolean | null
          relationship_type: string
          unit_number: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          relationship_type?: string
          unit_number: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          relationship_type?: string
          unit_number?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_owners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webcams: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          location: string
          name: string
          updated_at: string
          url: string
          webcam_type: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          location: string
          name: string
          updated_at?: string
          url: string
          webcam_type: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          location?: string
          name?: string
          updated_at?: string
          url?: string
          webcam_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_by_phone: {
        Args: { user_phone: string }
        Returns: {
          e164_phone: string
          user_email: string
          user_exists: boolean
        }[]
      }
      check_user_has_phone: {
        Args: { user_email: string }
        Returns: {
          has_phone: boolean
          phone_number: string
        }[]
      }
      cleanup_old_assistant_messages: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "board"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["owner", "admin", "board"],
    },
  },
} as const
