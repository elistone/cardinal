<template>
  <main class="state-no-config" aria-label="Setup required">
    <div class="state-no-config__card">
      <div class="state-no-config__icon" aria-hidden="true">⚡</div>
      <h2 class="state-no-config__title">Set up Cardinal</h2>
      <p class="state-no-config__body">
        Cardinal isn't connected to your home yet. To get started, tell it which
        energy sensors to read.
      </p>
      <p class="state-no-config__hint">
        Go to <strong>Settings → Integrations → Cardinal</strong> in Home Assistant
        to configure your sensors.
      </p>
    </div>
  </main>
</template>

<style scoped>
.state-no-config {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.state-no-config__card {
  max-width: 420px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.state-no-config__icon {
  font-size: 3rem;
  line-height: 1;
  opacity: 0.3;
}

.state-no-config__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.state-no-config__body {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.state-no-config__hint {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text-subdued);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
}

.state-no-config__hint strong {
  color: var(--color-text-secondary);
  font-weight: 600;
}
</style>
