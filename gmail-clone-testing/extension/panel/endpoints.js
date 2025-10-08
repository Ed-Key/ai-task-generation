/**
 * Endpoints Configuration
 * Parameter metadata and endpoint definitions for Gmail API
 */

// ===== PARAMETER METADATA =====
export const parameterMetadata = {
  'name': {
    type: 'string',
    label: 'Label Name',
    placeholder: 'e.g., Work, Personal, Important',
    helpText: 'Give your label a descriptive name that you\'ll recognize in Gmail',
    required: true
  },

  'labelListVisibility': {
    type: 'enum',
    label: 'Sidebar Visibility',
    helpText: 'Control when this label appears in your Gmail sidebar',
    options: [
      { value: 'labelShow', label: 'Always Show', description: 'Label always appears in sidebar' },
      { value: 'labelShowIfUnread', label: 'Show If Unread', description: 'Label appears only when it has unread messages' },
      { value: 'labelHide', label: 'Hide', description: 'Label never appears in sidebar (accessible via search)' }
    ],
    defaultValue: 'labelShow',
    required: false
  },

  'messageListVisibility': {
    type: 'enum',
    label: 'Message List Visibility',
    helpText: 'Control whether messages with this label appear in your message list',
    options: [
      { value: 'show', label: 'Show in List', description: 'Messages appear in message list' },
      { value: 'hide', label: 'Hide from List', description: 'Messages are hidden from message list' }
    ],
    defaultValue: 'show',
    required: false
  },

  'q': {
    type: 'search',
    label: 'Search Query',
    placeholder: 'e.g., is:unread from:boss@company.com',
    helpText: 'Use Gmail search syntax to filter results',
    examples: [
      { query: 'is:unread', description: 'Unread messages' },
      { query: 'is:starred', description: 'Starred messages' },
      { query: 'from:user@example.com', description: 'From specific sender' },
      { query: 'subject:urgent', description: 'Subject contains "urgent"' },
      { query: 'has:attachment', description: 'Has attachments' },
      { query: 'after:2024/01/01', description: 'Sent after January 1, 2024' }
    ],
    required: false
  },

  'id': {
    type: 'id',
    label: 'ID',
    placeholder: 'e.g., Label_123 or 18c5f8a9b2d3e4f5',
    helpText: 'Use a "List" endpoint first to find the ID you need',
    required: true
  },

  'labelIds': {
    type: 'array',
    label: 'Label IDs',
    placeholder: 'e.g., INBOX,UNREAD,Label_123',
    helpText: 'Enter label IDs separated by commas (no spaces)',
    examples: [
      { value: 'INBOX', description: 'Inbox label' },
      { value: 'UNREAD', description: 'Unread label' },
      { value: 'STARRED', description: 'Starred label' },
      { value: 'TRASH', description: 'Trash label' },
      { value: 'SPAM', description: 'Spam label' }
    ],
    required: false
  },

  'addLabelIds': {
    type: 'array',
    label: 'Labels to Add',
    placeholder: 'e.g., STARRED,Label_Important',
    helpText: 'Label IDs to add to this item (comma-separated)',
    examples: [
      { value: 'STARRED', description: 'Star this item' },
      { value: 'IMPORTANT', description: 'Mark as important' },
      { value: 'UNREAD', description: 'Mark as unread' }
    ],
    required: false
  },

  'removeLabelIds': {
    type: 'array',
    label: 'Labels to Remove',
    placeholder: 'e.g., UNREAD,INBOX',
    helpText: 'Label IDs to remove from this item (comma-separated)',
    examples: [
      { value: 'UNREAD', description: 'Mark as read' },
      { value: 'INBOX', description: 'Archive (remove from inbox)' },
      { value: 'STARRED', description: 'Unstar' }
    ],
    required: false
  },

  'maxResults': {
    type: 'number',
    label: 'Maximum Results',
    placeholder: 'e.g., 10',
    helpText: 'Number of results to return (1-500, default is 100)',
    min: 1,
    max: 500,
    defaultValue: 100,
    required: false
  },

  'to': {
    type: 'email',
    label: 'Recipient',
    placeholder: 'e.g., recipient@example.com',
    helpText: 'Email address of the person you\'re sending to',
    required: true
  },

  'subject': {
    type: 'string',
    label: 'Subject',
    placeholder: 'e.g., Meeting tomorrow at 3pm',
    helpText: 'Subject line of the email',
    required: true
  },

  'body': {
    type: 'textarea',
    label: 'Message Body',
    placeholder: 'Write your email message here...',
    helpText: 'The content of your email',
    rows: 5,
    required: true
  }
};

// ===== ENDPOINTS CONFIGURATION =====
export const endpoints = {
  // LABELS
  'list-labels': {
    id: 'list-labels',
    name: 'List Labels',
    resource: 'labels',
    method: 'GET',
    path: '/users/me/labels',
    paramsConfig: [],
    docs: 'Lists all labels in your mailbox. Use this to find label IDs for other operations.'
  },

  'get-label': {
    id: 'get-label',
    name: 'Get Label',
    resource: 'labels',
    method: 'GET',
    path: '/users/me/labels/{id}',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' }
    ],
    docs: 'Gets the details of a specific label, including its name and visibility settings.'
  },

  'create-label': {
    id: 'create-label',
    name: 'Create Label',
    resource: 'labels',
    method: 'POST',
    path: '/users/me/labels',
    paramsConfig: [
      { ...parameterMetadata.name, name: 'name' },
      { ...parameterMetadata.labelListVisibility, name: 'labelListVisibility' },
      { ...parameterMetadata.messageListVisibility, name: 'messageListVisibility' }
    ],
    docs: 'Creates a new label with the specified name and visibility settings.'
  },

  'update-label': {
    id: 'update-label',
    name: 'Update Label',
    resource: 'labels',
    method: 'PATCH',
    path: '/users/me/labels/{id}',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' },
      { ...parameterMetadata.name, name: 'name', required: false, helpText: 'New name for the label (leave empty to keep current name)' }
    ],
    docs: 'Updates the name or properties of an existing label.'
  },

  'delete-label': {
    id: 'delete-label',
    name: 'Delete Label',
    resource: 'labels',
    method: 'DELETE',
    path: '/users/me/labels/{id}',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' }
    ],
    docs: 'Permanently deletes the specified label. This cannot be undone.'
  },

  // THREADS
  'list-threads': {
    id: 'list-threads',
    name: 'List Threads',
    resource: 'threads',
    method: 'GET',
    path: '/users/me/threads',
    paramsConfig: [
      { ...parameterMetadata.q, name: 'q' },
      { ...parameterMetadata.labelIds, name: 'labelIds' },
      { ...parameterMetadata.maxResults, name: 'maxResults' }
    ],
    docs: 'Lists conversation threads in your mailbox.'
  },

  'get-thread': {
    id: 'get-thread',
    name: 'Get Thread',
    resource: 'threads',
    method: 'GET',
    path: '/users/me/threads/{id}',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' }
    ],
    docs: 'Gets the specified thread with all its messages and details.'
  },

  'modify-thread': {
    id: 'modify-thread',
    name: 'Modify Thread',
    resource: 'threads',
    method: 'POST',
    path: '/users/me/threads/{id}/modify',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' },
      { ...parameterMetadata.addLabelIds, name: 'addLabelIds' },
      { ...parameterMetadata.removeLabelIds, name: 'removeLabelIds' }
    ],
    docs: 'Modifies the labels on the specified thread.'
  },

  'trash-thread': {
    id: 'trash-thread',
    name: 'Trash Thread',
    resource: 'threads',
    method: 'POST',
    path: '/users/me/threads/{id}/trash',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' }
    ],
    docs: 'Moves the specified thread to trash.'
  },

  'delete-thread': {
    id: 'delete-thread',
    name: 'Delete Thread',
    resource: 'threads',
    method: 'DELETE',
    path: '/users/me/threads/{id}',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' }
    ],
    docs: 'Permanently deletes the specified thread and all its messages.'
  },

  // MESSAGES
  'list-messages': {
    id: 'list-messages',
    name: 'List Messages',
    resource: 'messages',
    method: 'GET',
    path: '/users/me/messages',
    paramsConfig: [
      { ...parameterMetadata.q, name: 'q' },
      { ...parameterMetadata.labelIds, name: 'labelIds' },
      { ...parameterMetadata.maxResults, name: 'maxResults' }
    ],
    docs: 'Lists individual messages in your mailbox.'
  },

  'get-message': {
    id: 'get-message',
    name: 'Get Message',
    resource: 'messages',
    method: 'GET',
    path: '/users/me/messages/{id}',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' }
    ],
    docs: 'Gets the specified message with full details.'
  },

  'modify-message': {
    id: 'modify-message',
    name: 'Modify Message',
    resource: 'messages',
    method: 'POST',
    path: '/users/me/messages/{id}/modify',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' },
      { ...parameterMetadata.addLabelIds, name: 'addLabelIds' },
      { ...parameterMetadata.removeLabelIds, name: 'removeLabelIds' }
    ],
    docs: 'Modifies the labels on the specified message.'
  },

  'trash-message': {
    id: 'trash-message',
    name: 'Trash Message',
    resource: 'messages',
    method: 'POST',
    path: '/users/me/messages/{id}/trash',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' }
    ],
    docs: 'Moves the specified message to trash.'
  },

  'delete-message': {
    id: 'delete-message',
    name: 'Delete Message',
    resource: 'messages',
    method: 'DELETE',
    path: '/users/me/messages/{id}',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' }
    ],
    docs: 'Permanently deletes the specified message.'
  },

  'send-message': {
    id: 'send-message',
    name: 'Send Message',
    resource: 'messages',
    method: 'POST',
    path: '/users/me/messages/send',
    paramsConfig: [
      { ...parameterMetadata.to, name: 'to' },
      { ...parameterMetadata.subject, name: 'subject' },
      { ...parameterMetadata.body, name: 'body' }
    ],
    docs: 'Sends an email message. The message will be automatically encoded in RFC 2822 format and base64url encoded before sending.'
  },

  // DRAFTS
  'list-drafts': {
    id: 'list-drafts',
    name: 'List Drafts',
    resource: 'drafts',
    method: 'GET',
    path: '/users/me/drafts',
    paramsConfig: [
      { ...parameterMetadata.maxResults, name: 'maxResults' }
    ],
    docs: 'Lists all draft messages in your mailbox.'
  },

  'get-draft': {
    id: 'get-draft',
    name: 'Get Draft',
    resource: 'drafts',
    method: 'GET',
    path: '/users/me/drafts/{id}',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' }
    ],
    docs: 'Gets the specified draft including the message content.'
  },

  'create-draft': {
    id: 'create-draft',
    name: 'Create Draft',
    resource: 'drafts',
    method: 'POST',
    path: '/users/me/drafts',
    paramsConfig: [
      { ...parameterMetadata.to, name: 'to' },
      { ...parameterMetadata.subject, name: 'subject' },
      { ...parameterMetadata.body, name: 'body' }
    ],
    docs: 'Creates a new draft email with the specified content.'
  },

  'update-draft': {
    id: 'update-draft',
    name: 'Update Draft',
    resource: 'drafts',
    method: 'PUT',
    path: '/users/me/drafts/{id}',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' },
      { ...parameterMetadata.to, name: 'to' },
      { ...parameterMetadata.subject, name: 'subject' },
      { ...parameterMetadata.body, name: 'body' }
    ],
    docs: 'Updates an existing draft with new content.'
  },

  'send-draft': {
    id: 'send-draft',
    name: 'Send Draft',
    resource: 'drafts',
    method: 'POST',
    path: '/users/me/drafts/send',
    paramsConfig: [
      { ...parameterMetadata.id, name: 'id' }
    ],
    docs: 'Sends the specified draft to its recipients.'
  }
};
