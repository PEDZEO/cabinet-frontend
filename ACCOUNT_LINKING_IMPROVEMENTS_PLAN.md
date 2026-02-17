# Account Linking Improvements Plan

Работаем строго по правилам `AGENTS.md`:

- атомарные изменения;
- строгая типизация;
- без затрагивания несвязанных файлов;
- обязательные проверки lint/type-check/build перед завершением этапа.

## Этапы

- [x] Этап 1: Создан план и трекер прогресса.
- [x] Этап 2: Обновить backend API linked identities (cooldown/unlink timing поля).
- [x] Этап 3: Обновить frontend типы и API-клиент под новые поля.
- [x] Этап 4: Улучшить UX в Profile:
  - [x] явный статус Telegram (что привязано, когда можно сменить);
  - [x] предупреждение при замене Telegram до действия;
  - [x] понятные сообщения с датой/таймером вместо только error-code.
- [x] Этап 5: Проверки и фиксация результата:
  - [x] `npm run format:check`
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `npm run build`
  - [x] обновить трекер, что сделано и что осталось.

## Текущее состояние

Сделано:

- создан план и трекер.
- backend: расширен ответ `/cabinet/auth/identities`.
- backend: `LinkedIdentity` получил `blocked_until` и `retry_after_seconds`.
- backend: добавлен `telegram_relink` со статусом смены Telegram.
- backend: cooldown payload сохраняет `created_at/expires_at` для точных дат в UI.
- frontend: обновлены типы под новый контракт.
- frontend (`Profile`):
  - добавлен блок статуса смены Telegram;
  - добавлена кнопка сценария `Сменить Telegram` (инициация отвязки);
  - добавлен вывод времени до разблокировки и точной даты.
  - поток привязки переведен на пошаговый state-machine (`idle -> preview -> warning/manual -> done`), подтверждение доступно только после preview.
- проверки пройдены:
  - `npm run format:check`;
  - `npm run lint`;
  - `npm run type-check`;
  - `npm run build`;
  - `ruff format --check` и `ruff check` для backend-файлов.

Осталось:

- по текущему плану обязательные пункты завершены.
