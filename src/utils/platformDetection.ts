export type Platform = 
  | 'google-meet'
  | 'zoom'
  | 'teams'
  | 'webex'
  | 'canvas'
  | 'blackboard'
  | 'moodle'
  | null;

export function detectPlatform(url: string): Platform {
  if (url.includes('meet.google.com')) return 'google-meet';
  if (url.includes('zoom.us/j/')) return 'zoom';
  if (url.includes('teams.microsoft.com')) return 'teams';
  if (url.includes('webex.com/meet')) return 'webex';
  if (url.includes('canvas.instructure.com')) return 'canvas';
  if (url.includes('blackboard.com')) return 'blackboard';
  if (url.includes('moodle.org')) return 'moodle';
  return null;
}

export function getPlatformConfig(platform: Platform) {
  const configs = {
    'google-meet': {
      containerSelector: '.crqnQb',
      chatSelector: '[data-is-persistent="true"]',
      transcriptSelector: '.iTTPOb'
    },
    'zoom': {
      containerSelector: '.meeting-client',
      chatSelector: '.chat-container',
      transcriptSelector: '.transcript-container'
    },
    'teams': {
      containerSelector: '.teams-content',
      chatSelector: '.chat-pane',
      transcriptSelector: '.transcript-pane'
    },
    'webex': {
      containerSelector: '.webex-meeting',
      chatSelector: '.chat-list',
      transcriptSelector: '.transcript-panel'
    },
    'canvas': {
      containerSelector: '#content',
      chatSelector: '.conversations',
      transcriptSelector: '.transcript'
    },
    'blackboard': {
      containerSelector: '#contentPanel',
      chatSelector: '.chat-panel',
      transcriptSelector: '.transcript-panel'
    },
    'moodle': {
      containerSelector: '#page-content',
      chatSelector: '.chat-messages',
      transcriptSelector: '.transcript'
    }
  };

  return platform ? configs[platform] : null;
}