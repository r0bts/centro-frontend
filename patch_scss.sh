sed -i '' -e 's/min-height: 220px;/min-height: 270px;/g' src/app/components/deportivo/actividades/deportivo-actividades.scss
sed -i '' -e 's/minmax(220px, 1fr)/minmax(290px, 1fr)/g' src/app/components/deportivo/actividades/deportivo-actividades.scss

cat << 'STYLE' >> src/app/components/deportivo/actividades/deportivo-actividades.scss

// ── Nuevas Acciones (Modern) ───────────────────────────────────────────────────
.card-actions-modern {
  width: 100%;
}

.action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.4rem;
  background: var(--bs-gray-100);
  border: 1px solid var(--bs-gray-200);
  transition: all 0.2s ease;

  &:hover {
    background: var(--bs-gray-200);
    transform: translateY(-1px);
  }

  &.text-danger:hover {
    background: rgba(var(--bs-danger-rgb), 0.1);
    border-color: rgba(var(--bs-danger-rgb), 0.2);
  }
}

.activity-card {
  padding: 1.5rem;
  
  .activity-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }
  
  .form-switch .form-check-input {
    width: 2.2em;
    height: 1.1em;
  }
}
STYLE
