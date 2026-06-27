import type { Meta, StoryObj } from '@storybook/vue3'
import { ref, onUnmounted } from 'vue'
import InsightBlock from '../components/InsightBlock.vue'
import type { InsightSentiment, InsightConfidence } from '@cardinal/domain'

const meta: Meta<typeof InsightBlock> = {
  title: 'Components/InsightBlock',
  component: InsightBlock,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    sentiment: { control: 'select', options: ['positive', 'neutral', 'negative'] },
    confidence: { control: 'select', options: ['high', 'medium', 'low'] },
  },
}

export default meta
type Story = StoryObj<typeof InsightBlock>

// ── Active energy states ───────────────────────────────────────────────────────

export const BatteryChargingFromSolar: Story = {
  args: {
    title: 'Charging from Solar',
    description: 'Your battery is charging from excess solar. No grid energy is being used.',
    detail: 'Battery is 68% full and rising. Exporting 800 W to the grid as well.',
    sentiment: 'positive',
    confidence: 'high',
  },
}

export const RunningOnSolar: Story = {
  args: {
    title: 'Running on Solar',
    description: 'Your home is running entirely on solar right now. Battery is full.',
    sentiment: 'positive',
    confidence: 'high',
  },
}

export const ExportingSolar: Story = {
  args: {
    title: 'Exporting Solar',
    description: "Your battery is full and solar is generating more than your home needs. You're exporting 3 kW to the grid.",
    detail: "You've exported 6.3 kWh so far today.",
    sentiment: 'positive',
    confidence: 'high',
  },
}

export const RunningOnBattery: Story = {
  args: {
    title: 'Running on Battery',
    description: 'Your home is running on battery power. No solar and no grid import.',
    detail: 'Battery is at 80% and supplying 2 kW.',
    sentiment: 'positive',
    confidence: 'high',
  },
}

export const GridPower: Story = {
  args: {
    title: 'Grid Power',
    description: 'Your home is running on grid power overnight. Solar generation has stopped.',
    detail: 'Battery is held in reserve at 55%.',
    sentiment: 'neutral',
    confidence: 'high',
  },
}

export const HighGridImport: Story = {
  args: {
    title: 'High Grid Import',
    description: 'Your home is drawing more grid power than usual. Battery has been depleted.',
    sentiment: 'negative',
    confidence: 'high',
  },
}

// ── Confidence states ──────────────────────────────────────────────────────────

export const EstimatedInsight: Story = {
  name: 'Estimated (low confidence)',
  args: {
    title: 'Running on Solar',
    description: 'Your home appears to be running on solar. Some sensor data is unavailable.',
    sentiment: 'positive',
    confidence: 'medium',
  },
}

// ── System states ──────────────────────────────────────────────────────────────

export const Loading: Story = {
  args: {
    title: '',
    description: '',
    sentiment: 'neutral',
    confidence: 'high',
    isLoading: true,
  },
}

// ── Transition demo ────────────────────────────────────────────────────────────
// Cycles through real energy states every 3 seconds so the cross-fade
// dissolve and sentiment border transition are visible in Storybook.

interface InsightFixture {
  title: string
  description: string
  detail?: string
  sentiment: InsightSentiment
  confidence: InsightConfidence
}

const CYCLING_INSIGHTS: InsightFixture[] = [
  {
    title: 'Charging from Solar',
    description: 'Your battery is charging from excess solar. No grid energy is being used.',
    detail: 'Battery is 68% full and rising.',
    sentiment: 'positive',
    confidence: 'high',
  },
  {
    title: 'Exporting Solar',
    description: "Battery is full. You're exporting 3 kW of surplus solar to the grid.",
    detail: "You've exported 6.3 kWh so far today.",
    sentiment: 'positive',
    confidence: 'high',
  },
  {
    title: 'Running on Battery',
    description: 'Your home is running on battery power. No solar and no grid import.',
    detail: 'Battery at 80%, supplying 2 kW.',
    sentiment: 'positive',
    confidence: 'high',
  },
  {
    title: 'Grid Power',
    description: 'Your home is running on grid power overnight. Solar generation has stopped.',
    detail: 'Battery held in reserve at 55%.',
    sentiment: 'neutral',
    confidence: 'high',
  },
  {
    title: 'High Grid Import',
    description: 'Your home is drawing more grid power than usual. Battery has been depleted.',
    sentiment: 'negative',
    confidence: 'high',
  },
]

export const TransitionDemo: Story = {
  name: 'Motion — Insight Transition',
  render: () => ({
    components: { InsightBlock },
    setup() {
      const index = ref(0)
      const current = ref<InsightFixture>(CYCLING_INSIGHTS[0]!)

      const timer = setInterval(() => {
        index.value = (index.value + 1) % CYCLING_INSIGHTS.length
        current.value = CYCLING_INSIGHTS[index.value]!
      }, 3000)

      onUnmounted(() => clearInterval(timer))

      return { current }
    },
    template: `
      <div style="max-width: 640px;">
        <InsightBlock
          :title="current.title"
          :description="current.description"
          :detail="current.detail"
          :sentiment="current.sentiment"
          :confidence="current.confidence"
        />
        <p style="margin-top: 16px; font-size: 0.75rem; color: #64748b;">
          Cycling through energy states every 3 seconds. Watch the cross-fade and sentiment border transition.
        </p>
      </div>
    `,
  }),
}
