# AGENTS.md Compliance Audit

Дата проверки: 2026-02-18
Репозиторий: `cabinet-frontend`
Источник правил: `/home/pedzeo/AGENTS.md`

## Найденные несоответствия

### 1) Medium — нарушено правило "One file = one responsibility"
Крупные страницы содержат слишком много логики и UI в одном файле:
- `src/pages/Subscription.tsx` (~3616 строк)
- `src/pages/LiteSubscription.tsx` (~1401 строк)
- `src/pages/AdminWheel.tsx` (~1299 строк)
- `src/pages/AdminDashboard.tsx` (~1191 строк)
- `src/pages/AdminRemnawave.tsx` (~1122 строк)

Риск:
- сложнее сопровождать и рефакторить
- выше вероятность регрессий
- труднее покрывать изменениями поэтапно

### 2) Medium — перегруженный роутинг/доступы в одном файле
- `src/App.tsx` (~762 строки)

Проблема:
- в одном месте смешаны lazy-импорты, route-конфиг, guard-логика и layout-обвязка
- это против принципа композиции и разделения ответственности

### 3) Low — типы собраны в один большой агрегат
- `src/types/index.ts` (~689 строк)

Проблема:
- доменные типы разных областей собраны в одном файле
- хуже читаемость и поддержка domain-specific typing

## Что соответствует правилам

- `npm run lint` — passed
- `npm run type-check` — passed
- `npm run build` — passed
- TypeScript `strict` включён (`tsconfig.json`)
- Явных `any` в `src` не найдено
- Пустых `catch {}` не найдено

## Остаточные риски

- В проекте нет отдельного test-скрипта/слоя автотестов, поэтому регрессии в основном ловятся линтером/тайпчеком/ручной проверкой.

## Рекомендуемый порядок исправлений

1. Разделить `src/pages/Subscription.tsx` на модули (`hooks/`, `components/`, `utils/`).
2. Декомпозировать `src/App.tsx`: вынести route-конфиг и guards в отдельные файлы.
3. Разбить `src/types/index.ts` по доменам (`types/admin.ts`, `types/subscription.ts`, и т.д.).

## Прогресс рефакторинга

- [x] Этап 1 (Subscription): вынесены общие хелперы и иконки в отдельные файлы:
  - `src/pages/subscription/utils/errors.ts`
  - `src/pages/subscription/utils/flags.ts`
  - `src/pages/subscription/components/StatusIcons.tsx`
- [~] Этап 2 (Subscription): частично вынесена логика purchase-flow в `src/pages/subscription/utils/purchaseFlow.ts` (шаги, лейблы шагов, фильтрация доступных серверов, цвет прогресса).
- [~] Этап 2.2 (Subscription): вынесено управление модалками в `src/pages/subscription/hooks/useSubscriptionModals.ts`.
- [~] Этап 2.3 (Subscription): вынесены device mutation-обработчики в `src/pages/subscription/hooks/useDeviceManagementMutations.ts`.
- [ ] Этап 2.4 (Subscription): вынести оставшиеся mutation-обработчики (`traffic`, `countries`, `tariff switch/purchase`) в `hooks/`.
- [ ] Этап 3 (App): разнести guard-обвязку и route-конфиг по отдельным модулям.
- [ ] Этап 4 (types): декомпозировать `src/types/index.ts` по доменам.
