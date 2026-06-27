import type { Meta, StoryObj } from '@storybook/vue3'
import { ref, onUnmounted } from 'vue'
import MetricCard from '../components/MetricCard.vue'

const meta: Meta<typeof MetricCard> = {
  title: 'Components/MetricCard',
  component: MetricCard,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    concept: { control: 'select', options: ['solar', 'battery', 'grid', 'home'] },
  },
  decorators: [
    () => ({ template: '<div style="max-width: 200px"><story /></div>' }),
  ],
}

export default meta
type Story = StoryObj<typeof MetricCard>

// ── Solar ──────────────────────────────────────────────────────────────────────

export const SolarGenerating: Story = {
  args: {
    label: 'Solar output',
    value: 3600,
    unit: 'W',
    concept: 'solar',
  },
}

export const SolarIdle: Story = {
  args: {
    label: 'Solar output',
    value: 0,
    unit: 'W',
    concept: 'solar',
  },
}

// ── Battery ────────────────────────────────────────────────────────────────────
// accentColor reflects the dynamic state: charging (green) vs discharging (blue).

export const BatteryCharging: Story = {
  args: {
    label: 'Battery',
    value: 1800,
    unit: 'W',
    concept: 'battery',
    directionLabel: '58% · Charging',
    accentColor: 'var(--color-battery-charging)',
  },
}

export const BatteryDischarging: Story = {
  args: {
    label: 'Battery',
    value: 2100,
    unit: 'W',
    concept: 'battery',
    directionLabel: '73% · Discharging',
    accentColor: 'var(--color-battery-discharging)',
  },
}

export const BatteryIdle: Story = {
  args: {
    label: 'Battery',
    value: 0,
    unit: 'W',
    concept: 'battery',
    directionLabel: '42% · Standby',
    accentColor: 'var(--color-battery-idle)',
  },
}

// ── Grid ───────────────────────────────────────────────────────────────────────
// accentColor reflects direction: import (red) vs export (purple).

export const GridImporting: Story = {
  args: {
    label: 'Grid',
    value: 850,
    unit: 'W',
    concept: 'grid',
    directionLabel: 'Importing',
    accentColor: 'var(--color-grid-import)',
  },
}

export const GridExporting: Story = {
  args: {
    label: 'Grid',
    value: 3300,
    unit: 'W',
    concept: 'grid',
    directionLabel: 'Exporting',
    accentColor: 'var(--color-grid-export)',
  },
}

export const GridIdle: Story = {
  args: {
    label: 'Grid',
    value: 0,
    unit: 'W',
    concept: 'grid',
    directionLabel: 'Idle',
    accentColor: 'var(--color-battery-idle)',
  },
}

// ── Home ───────────────────────────────────────────────────────────────────────

export const HomeConsuming: Story = {
  args: {
    label: 'Home consumption',
    value: 2100,
    unit: 'W',
    concept: 'home',
  },
}

// ── System states ──────────────────────────────────────────────────────────────

export const Loading: Story = {
  args: {
    label: 'Solar output',
    value: 0,
    unit: 'W',
    concept: 'solar',
    isLoading: true,
  },
}

export const Unavailable: Story = {
  args: {
    label: 'Solar output',
    value: null,
    unit: 'W',
    concept: 'solar',
  },
}

// ── Visual energy language demos ───────────────────────────────────────────────

// Four cards at different power levels showing the magnitude scaling in action.
// Same concept, same label — only watts differ. The accent bar grows taller and
// brighter, and the ambient tint deepens, as power increases.
export const IntensityComparison: Story = {
  name: 'Visual — Magnitude Scaling',
  render: () => ({
    components: { MetricCard },
    template: `
      <div>
        <p style="font-size:0.75rem;color:#64748b;margin:0 0 16px;letter-spacing:0.05em;text-transform:uppercase;">
          Same concept · Different magnitude
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:440px;">
          <div>
            <MetricCard label="Solar output" :value="200"  unit="W" concept="solar" />
            <p style="font-size:0.7rem;color:#64748b;margin:8px 0 0;text-align:center;">200 W</p>
          </div>
          <div>
            <MetricCard label="Solar output" :value="1200" unit="W" concept="solar" />
            <p style="font-size:0.7rem;color:#64748b;margin:8px 0 0;text-align:center;">1.2 kW</p>
          </div>
          <div>
            <MetricCard label="Solar output" :value="3000" unit="W" concept="solar" />
            <p style="font-size:0.7rem;color:#64748b;margin:8px 0 0;text-align:center;">3.0 kW</p>
          </div>
          <div>
            <MetricCard label="Solar output" :value="4800" unit="W" concept="solar" />
            <p style="font-size:0.7rem;color:#64748b;margin:8px 0 0;text-align:center;">4.8 kW</p>
          </div>
        </div>
        <p style="margin-top:16px;font-size:0.75rem;color:#64748b;">
          Accent bar height, opacity and background tint all scale logarithmically.
          Users sense magnitude before reading numbers.
        </p>
      </div>
    `,
  }),
}

// Demonstrates accent colour transitions between battery states.
// A battery cycling through charging → standby → discharging shows the smooth
// colour handoff: green → grey → blue.
const BATTERY_CYCLE: Array<{ value: number; accentColor: string; label: string }> = [
  { value: 1400, accentColor: 'var(--color-battery-charging)',    label: '58% · Charging'    },
  { value: 0,    accentColor: 'var(--color-battery-idle)',        label: '80% · Standby'     },
  { value: 2100, accentColor: 'var(--color-battery-discharging)', label: '80% · Discharging' },
  { value: 0,    accentColor: 'var(--color-battery-idle)',        label: '42% · Standby'     },
]

export const BatteryStateTransition: Story = {
  name: 'Motion — Battery State Transition',
  render: () => ({
    components: { MetricCard },
    setup() {
      const index = ref(0)
      const current = ref(BATTERY_CYCLE[0]!)

      const timer = setInterval(() => {
        index.value = (index.value + 1) % BATTERY_CYCLE.length
        current.value = BATTERY_CYCLE[index.value]!
      }, 2500)

      onUnmounted(() => clearInterval(timer))

      return { current }
    },
    template: `
      <div>
        <div style="max-width:200px;">
          <MetricCard
            label="Battery"
            :value="current.value"
            unit="W"
            concept="battery"
            :direction-label="current.label"
            :accent-color="current.accentColor"
          />
        </div>
        <p style="margin-top:16px;font-size:0.75rem;color:#64748b;">
          Battery cycles Charging → Standby → Discharging every 2.5 s.
          Watch the accent bar colour and ambient tint transition.
        </p>
      </div>
    `,
  }),
}

// Cycles through realistic solar generation values showing count animation,
// W→kW unit transition, and accent bar magnitude scaling together.
const SOLAR_VALUES = [280, 1450, 2700, 3600, 4100, 1020, 960, 450, 3200]

export const LiveCountAnimation: Story = {
  name: 'Motion — Live Count Animation',
  render: () => ({
    components: { MetricCard },
    setup() {
      const index = ref(0)
      const value = ref(SOLAR_VALUES[0]!)

      const timer = setInterval(() => {
        index.value = (index.value + 1) % SOLAR_VALUES.length
        value.value = SOLAR_VALUES[index.value]!
      }, 2000)

      onUnmounted(() => clearInterval(timer))

      return { value }
    },
    template: `
      <div>
        <div style="max-width:200px;">
          <MetricCard label="Solar output" :value="value" unit="W" concept="solar" />
        </div>
        <p style="margin-top:16px;font-size:0.75rem;color:#64748b;">
          Value changes every 2 s. Accent bar, count animation, and W→kW transition.
        </p>
      </div>
    `,
  }),
}
