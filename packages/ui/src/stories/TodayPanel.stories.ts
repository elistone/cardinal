import type { Meta, StoryObj } from '@storybook/vue3'
import type { DailySummary, DailyFinancials } from '@cardinal/domain'
import TodayPanel from '../components/TodayPanel.vue'

const meta: Meta<typeof TodayPanel> = {
  title: 'Panels/TodayPanel',
  component: TodayPanel,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof TodayPanel>

const TODAY = new Date()

const SUMMARY: DailySummary = {
  date: TODAY,
  solar:   { generatedKwh: 18.4 },
  battery: { chargedKwh: 8.2, dischargedKwh: 5.1 },
  grid:    { importedKwh: 1.2, exportedKwh: 6.3 },
  home:    { consumedKwh: 12.1 },
}

const FINANCIALS: DailyFinancials = {
  date: TODAY,
  importCost:     0.29,
  exportEarnings: 0.95,
  savings:        2.94,
  currency:       'GBP',
}

export const WithFinancials: Story = {
  name: 'State — Full data with financials',
  args: {
    summary:    SUMMARY,
    financials: FINANCIALS,
    isLoading:  false,
  },
}

export const NoFinancials: Story = {
  name: 'State — Energy data, no tariffs configured',
  args: {
    summary:    SUMMARY,
    financials: null,
    isLoading:  false,
  },
}

export const Loading: Story = {
  name: 'State — Loading (connecting)',
  args: {
    summary:    null,
    financials: null,
    isLoading:  true,
  },
}

export const HighGeneration: Story = {
  name: 'Data — High solar day',
  args: {
    summary: {
      date: TODAY,
      solar:   { generatedKwh: 42.1 },
      battery: { chargedKwh: 12.0, dischargedKwh: 10.4 },
      grid:    { importedKwh: 0, exportedKwh: 24.8 },
      home:    { consumedKwh: 17.3 },
    },
    financials: {
      date: TODAY,
      importCost:     0,
      exportEarnings: 3.72,
      savings:        6.89,
      currency:       'GBP',
    },
    isLoading: false,
  },
}

export const GridHeavyDay: Story = {
  name: 'Data — Grid-heavy day (low solar)',
  args: {
    summary: {
      date: TODAY,
      solar:   { generatedKwh: 2.1 },
      battery: { chargedKwh: 0.8, dischargedKwh: 1.2 },
      grid:    { importedKwh: 14.6, exportedKwh: 0 },
      home:    { consumedKwh: 15.7 },
    },
    financials: {
      date: TODAY,
      importCost:     3.58,
      exportEarnings: 0,
      savings:        0.51,
      currency:       'GBP',
    },
    isLoading: false,
  },
}
