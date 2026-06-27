import type { Preview } from '@storybook/vue3'
// Import from the canonical token file so Storybook and the runtime
// panel always use identical CSS variable definitions.
import '../src/tokens.css'

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
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div style="
          font-family: var(--font-family-base);
          color: var(--color-text-primary);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        ">
          <story />
        </div>
      `,
    }),
  ],
}

export default preview
