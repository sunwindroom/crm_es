export interface FollowUp {
  id: string;
  lead_id: string;
  content: string;
  next_action?: string;
  next_action_date?: Date;
  created_by: string;
  parent_id?: string;
  type: 'follow_up' | 'reply' | 'comment';
  created_at: Date;
  creator?: {
    id: string;
    name: string;
  };
  parent?: FollowUp;
  replies?: FollowUp[];
}

export interface CreateFollowUpDto {
  leadId: string;
  content: string;
  nextAction?: string;
  nextActionDate?: Date;
}

export interface ReplyFollowUpDto {
  parentId: string;
  content: string;
}

export interface CommentFollowUpDto {
  parentId: string;
  content: string;
}
