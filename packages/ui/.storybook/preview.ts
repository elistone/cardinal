import type { Preview } from '@storybook/vue3'
import './tokens.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f1117' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    controls: {
      matchers: {
        date: /Date$/i,
      },
    },
  },
}

export default preview
