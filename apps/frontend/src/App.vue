<template>
  <div class="cardinal">
    <p v-if="stateSummary">{{ stateSummary.headline }}</p>
    <p v-else>Loading…</p>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEnergyStore } from './stores/energy'

const { stateSummary } = storeToRefs(useEnergyStore())
</script>

<style>
.cardinal {
  font-family: system-ui, sans-serif;
  height: 100%;
  width: 100%;
}
</style>
