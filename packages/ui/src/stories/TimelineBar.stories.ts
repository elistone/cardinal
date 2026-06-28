import type { Meta, StoryObj } from '@storybook/vue3'
import TimelineBar from '../components/TimelineBar.vue'
import { buildDay, buildWaveform, SUNNY_SUMMER_DAY, CLOUDY_DAY, STORM_NO_SOLAR } from '@cardinal/simulation'

const TODAY = new Date(2026, 5, 27)  // 27 June 2026

const sunnyDay = buildDay(SUNNY_SUMMER_DAY, TODAY)
const cloudyDay = buildDay(CLOUDY_DAY, TODAY)
const stormDay = buildDay(STORM_NO_SOLAR, TODAY)

const sunnyWaveform = buildWaveform(sunnyDay)
const cloudyWaveform = buildWaveform(cloudyDay)
const stormWaveform = buildWaveform(stormDay)

const DAY_START = new Date(2026, 5, 27, 0, 0, 0)
const DAY_END = new Date(2026, 5, 27, 23, 59, 59)

const meta: Meta<typeof TimelineBar> = {
  title: 'TimelineBar',
  component: TimelineBar,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
}

export default meta
type Story = StoryObj<typeof TimelineBar>

export const Live: Story = {
  args: {
    isLive: true,
    currentTime: new Date(2026, 5, 27, 14, 23, 11),
    dayStart: DAY_START,
    dayEnd: DAY_END,
    waveform: sunnyWaveform,
  },
}

export const HistoricalMorning: Story = {
  args: {
    isLive: false,
    currentTime: new Date(2026, 5, 27, 9, 15, 0),
    dayStart: DAY_START,
    dayEnd: DAY_END,
    waveform: sunnyWaveform,
  },
}

export const HistoricalSolarPeak: Story = {
  args: {
    isLive: false,
    currentTime: new Date(2026, 5, 27, 13, 0, 0),
    dayStart: DAY_START,
    dayEnd: DAY_END,
    waveform: sunnyWaveform,
  },
}

export const HistoricalEvening: Story = {
  args: {
    isLive: false,
    currentTime: new Date(2026, 5, 27, 19, 45, 0),
    dayStart: DAY_START,
    dayEnd: DAY_END,
    waveform: sunnyWaveform,
  },
}

export const CloudyDay: Story = {
  args: {
    isLive: false,
    currentTime: new Date(2026, 5, 27, 12, 0, 0),
    dayStart: DAY_START,
    dayEnd: DAY_END,
    waveform: cloudyWaveform,
  },
}

export const NoSolar: Story = {
  args: {
    isLive: false,
    currentTime: new Date(2026, 5, 27, 20, 30, 0),
    dayStart: DAY_START,
    dayEnd: DAY_END,
    waveform: stormWaveform,
  },
}

export const NoWaveform: Story = {
  args: {
    isLive: false,
    currentTime: new Date(2026, 5, 27, 10, 0, 0),
    dayStart: DAY_START,
    dayEnd: DAY_END,
  },
}

export const Midnight: Story = {
  args: {
    isLive: false,
    currentTime: new Date(2026, 5, 27, 0, 0, 30),
    dayStart: DAY_START,
    dayEnd: DAY_END,
    waveform: sunnyWaveform,
  },
}
