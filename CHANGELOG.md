# Changelog

## [1.8.0](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/compare/v1.7.0...v1.8.0) (2026-02-06)


### Features

* add blacklisted user blocking screen ([c5cad20](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/c5cad20a6f2069cf044d2a8fd55d1272d2631a40))
* add blacklisted user blocking screen ([5a8c1e7](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/5a8c1e7e33f4b5f3556076008842181098b65981))
* add drag-and-drop tariff sorting in admin panel ([ef365db](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/ef365db16b435862a56d7b9de46a668f5ccba11d))
* connect RemnaWave baseTranslations and fix SVG icons ([a50dea9](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/a50dea9a3d23c021948d720c06e6d54e22cbf92f))
* convert ConnectionModal to /connection page with crypto deep links ([445dd06](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/445dd0601a0a262d12a3329829516b9beb43693a))
* drag-and-drop tariff sorting ([6f3abf8](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/6f3abf82602765236ad98275d939a6f7e0474895))
* render original RemnaWave blocks on connection page ([79afe3a](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/79afe3a733167c6a64627aff70290a5f1815c6c2))
* **subscription:** auto-skip server selection step when only one available ([998f9db](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/998f9dbaf0ea9c3ae28ece77b4906e0f6e8f704f))
* **subscription:** auto-skip server selection when only one available ([e5a1c04](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/e5a1c04980e50f2e13494f6e45319872a8e65dfa))
* use app-level svgIconKey for app logos and improve tile contrast ([65a6714](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/65a671470d1be2157ac2670e9eb1933cda90581f))
* use platform displayName from RemnaWave config in connection page ([53940a0](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/53940a0169074ca5f1c40082bdfb13b2437406a6))


### Bug Fixes

* add bottom padding to last block in minimal layout ([5a69496](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/5a69496dde580341040efbeb625e072a192296d5))
* add light theme support to connection page ([88d9377](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/88d9377adbcb74336a25748ae13d7baf7c7da4f1))
* add retry logic for Telegram Mini App auth failures ([a1c0ceb](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/a1c0ceba19d5069c81e12c4c388d29f9790adde8))
* full-screen page loader and remove bg flash on transitions ([30d984c](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/30d984c5d464d3ca553b572d8dea8e5b66091288))
* increase bottom spacing for installation guide blocks ([c669d2e](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/c669d2e9b5fa09f552c583a43661475fc859160a))
* match header icon sizes for theme toggle and logout buttons ([48eee9f](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/48eee9fac4b4d871f94c185723ad27aa0327e60c))
* prevent header layout shift and unify action button styles ([d900c6f](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/d900c6f1527c7982442dae86531d7d0119f7c831))
* prevent header nav shift with invisible theme button placeholder ([50e675b](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/50e675b6e93a9279f95dc8a9ea415c481df54148))
* remove local toast from AdminPaymentMethods, use useNotify ([692e45a](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/692e45ad1833d670420ee5ca3f628106db7c6eab))
* remove nested scroll constraint from tariff servers and promo groups ([c944e9e](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/c944e9ef0ba76f94917b69f4bc3c24829220c246))
* remove space-y-0 that overrides block margins in minimal layout ([c4f1070](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/c4f1070f23c414cd4278e95dcc401140ee10e57d))
* resolve RemnaWave SVG icons and icon colors on connection page ([91afbbf](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/91afbbf3c629defcdac0d3fd6d42d31e4d1610b4))
* resolve Telegram Mini App auth failures on all platforms ([7df751e](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/7df751ea3570d4855ce921f79e096b1679f4b42e))
* restore platform dropdown with SVG icon and widen app chips to match original ([966343a](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/966343a4d8ce4ae37a2da1c5270754a70f43467a))
* restyle app cards to match original RemnaWave UI and debug icons ([42e70f7](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/42e70f72ffbd378bca1e6efed870c4212f8e48c1))
* standardize admin form inputs, validation, and sync with backend constraints ([6e7eb36](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/6e7eb36f761532202e89b690d0e6b6876e5cef5e))
* **subscription:** display promo discounts for devices, traffic and tariff switch ([6c22a52](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/6c22a522cccb2c371ac110a12efd5c823cee5848))
* **subscription:** display promo group discounts in device/traffic purchase and tariff switch ([46b93ef](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/46b93ef098798e626ea8504ceac32f4736f3ea65))
* theme preset persistence, page transition flash, and wheel LED jank ([f54ad4e](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/f54ad4eb1f88d053a9e21ca3846771133729c2e4))
* unify connection page design with global styles and add platform SVG icons ([4866003](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/4866003c23be3a7c02bee5ac4b5c4246c928f192))
* unify toast notifications and improve visual/behavior ([66a6697](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/66a6697ea1475d680ca58e68083f67af5174a0fc))
* use redirect page for all platforms and fallback to regular subscription URL ([5111b63](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/5111b63f2e5d4533a6a25994bd1051f8c0d48972))

## [1.7.0](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/compare/v1.6.2...v1.7.0) (2026-02-04)

### Features

- add Stars payment confirmation and admin validation ([e6f8ae6](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/e6f8ae6ab09c431d5322c851165f30469678ed72))
- replace payment modals with page-based navigation ([576893f](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/576893f5c6b67c19bee0cd562cd0430a88350619))

### Bug Fixes

- dim accent color for background blobs ([bb32cd8](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/bb32cd8757b116728c0e7357fc40bcb842e7a476))
- inline Stars confirmation and unified payment type display ([8068f84](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/8068f847247307aa3adae1f6965987882be8a785))
- prevent payment type reset after wheel spin ([4499c9a](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/4499c9ad57dcdcd3126c8d4261bc9f32accd21d7))
- unify wheel Stars payment across desktop and mobile ([02640d1](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/02640d1c38dde00d431058a399adcc85fd9bcaac))
- update Aurora colors reactively without recreating WebGL context ([59a251c](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/59a251cb8c706b3029990e58fc6003ce620f80d3))

## [1.6.2](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/compare/v1.6.1...v1.6.2) (2026-02-04)

### Bug Fixes

- add theme toggle to desktop header and sync theme across components ([bf00d37](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/bf00d37b4af799130e3dd8cd2c083ec933833281))
- Aurora animation ignoring light theme background color ([c1dc019](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/c1dc019c8b2819e13da42ad1c2648740a09279d1))
- replace individual light theme overrides with CSS variable swap ([9ac00c9](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/9ac00c94a6805577d6ac71e83fae5032217a31c9))
- use dynamic champagne variables for light theme palette swap ([ecd912b](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/ecd912b16a63b692b45361cfa53e7cacb0cb3e4f))
- use theme surface and background colors for Aurora animation ([a91e055](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/a91e0555979540f50ca1afef5ee8c91b162c4a7f))

## [1.6.1](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/compare/v1.6.0...v1.6.1) (2026-02-04)

### Bug Fixes

- add fallback recovery for Telegram popup callback not firing ([7ac7db4](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/7ac7db4ddb2950216334be01db37f185594bea6e))
- add HMR guard to prevent ConcurrentCallError on SDK double-init ([bcbda17](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/bcbda17220357815ee2df269e293db0fecee7bd3))
- get fresh Telegram WebApp reference on each popup call ([792fb1e](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/792fb1ed8a1cc4d4a5350556308e00e8cad5313a))
- prevent duplicate Telegram popup opening ([71647eb](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/71647ebc8795fc57f958d4fdedfb2f9c0b23837e))
- prevent popup cascade when Telegram callback doesn't fire ([2d00a5c](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/2d00a5c21fff339f229d8fe2001a898d15722cdd))
- resolve SDK v3 mount errors, back button and fullscreen not working ([61e3910](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/61e3910981e401fbc0b968615307e5101f6f96e9))
- use direct dialog.popup call instead of useDestructiveConfirm ([ef77276](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/ef77276246fdb60255f625289542584b83c93fcc))

## [1.6.0](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/compare/v1.5.0...v1.6.0) (2026-02-04)

### Features

- add animated MovingGradient background ([24781f3](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/24781f32ec0b7889ddb4a88d994d91b6d8593dec))
- add autocomplete to settings search ([e5096d5](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/e5096d571ff0b9ea3fb9c08c1cbece46a1ece656))
- add locales for user search in promo offer sending ([0c9d092](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/0c9d09280c600e03c8cd8b7f51c8eb27c664c22c))
- add Telegram/Email channel selection to broadcast create page ([0773afd](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/0773afdf6e37f0b8da679a176048764110795919))
- add useNotify hook for unified notifications ([6f4d1ef](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/6f4d1ef08587a671a3060c304bc8603df5d9a17e))
- add user search autocomplete for promo offer sending ([fc92267](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/fc922671d2fe2de7e4961205158c8e7e3404020a))
- extract promocodes and promo groups into separate pages ([a96ddde](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/a96ddde314d938c2ee2e7c8fe7eaab84007060df))
- improve tariff builder UI ([e19767a](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/e19767af82ed84c80f1e5cb0e9535962d360fd54))
- Linear-style UI redesign with improved mobile experience ([b953ee0](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/b953ee0b8c79c6340eca0467d65fee22d362875e))
- migrate to [@tma](https://github.com/tma).js/sdk-react for Telegram Mini App ([edb5be0](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/edb5be09ae372b6ee2985484518bdf76d87b89e4))
- move campaign statistics to dedicated page ([1027deb](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/1027deb134d58f72f40b2f18878e8700683a4c86))
- move ticket settings to dedicated page ([ead4606](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/ead4606bb59e59c50445c7b7198abf42c54e1326))
- redesign fortune wheel UI and add to mobile nav ([7e2802c](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/7e2802c5b5ee4bae1cf8d07009056e9c66688197))
- redesign fortune wheel with improved UX ([494285b](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/494285bcbf99d8f74873dcf571b0a780e968100b))
- replace broadcast creation modal with dedicated page ([175516e](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/175516ec9bc85575483fa7223838e5f52e4cfe7b))
- replace campaign creation modal with dedicated page ([bce4d94](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/bce4d94229c81d67a7621faccf9a69bd6b61d5e9))
- replace MovingGradient with Aurora WebGL background ([cffef41](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/cffef41f634f940da07645461420f32554e6da9d))
- replace tariff creation modal with dedicated page ([dc17695](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/dc1769520612286bc2da4bd25c23a60ab38792f3))
- scroll to tariffs section when clicking discount badge ([3613294](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/3613294a7869e6866d3f3d5d2dccde4102e05b9f))

### Bug Fixes

- add full i18n support for RemnaWave section and improve sync UI ([ed86dfa](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/ed86dfa8bd0c680f842bc17ef7663ee1d266ee11))
- add missing i18n keys for broadcast detail page ([c60a242](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/c60a242f1da4b03d44d56485d83313755a5a0c8e))
- add placeholders to all tariff form number inputs ([8cd95b8](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/8cd95b84fb703104d436d4ce417d3ab57aa66f9f))
- add Russian translation for device limit reduction reason ([e884860](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/e884860ab86b6cbcdb9db2858f47bd3813a18740))
- add Telegram header padding for Android fullscreen mode ([093c9f2](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/093c9f28935133cd300bf4c481d5c798011ecbfe))
- AdminTariffCreate back button and daily tariff colors ([d623cd4](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/d623cd41e9e9e15733c68b9640f0296f37043468))
- allow clearing number inputs and add validation ([47e28ee](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/47e28ee78fd417db86ad4a026f5983f68f0e1c76))
- Aurora uses theme colors from API with blur overlay ([55ae55f](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/55ae55f4af1050207ceac6db992f6bf66ce4b77b))
- disable Telegram swipe-to-close globally to prevent accidental app closures ([9b0be28](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/9b0be280d292179fb6e9f219c21d18ce1ae7e5fc))
- disable Telegram vertical swipes during drag operations ([8deca2f](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/8deca2fa5bf1da2ba76191616d4a1638d1d79f9d))
- handle unmounted SDK components gracefully ([baa57b9](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/baa57b907ecb3ada3623eafcffbc070a56e1915c))
- improve admin user detail tabs scroll and sync buttons design ([45dac03](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/45dac039f9e77f55fefe6ea1e761edd037bd13d8))
- improve header layout for mobile - stack button below title ([643d4fd](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/643d4fd3af891fc9a9e27501dae715f91242f200))
- improve mobile layout for bandwidth and add pluralization support ([e9af285](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/e9af285dadeeb0ce951940be46e07561f61844d9))
- improve tariff delete button visibility ([5b30f24](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/5b30f24e7e3bd672464a0314433d8649267e7828))
- improve Toast visibility and allow tariff deletion with subscriptions ([36cc01c](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/36cc01ca7e2489d603d96673f93237648832223e))
- make Aurora colors vibrant and increase speed ([851e6a3](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/851e6a353bbf5c48c7cdf36ba1d9fd821c775aff))
- promo offer button mobile layout ([1d4a99c](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/1d4a99c47432128402d213a3be3cbd9f316e6171))
- remove dark backgrounds causing black rectangles ([2926a5a](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/2926a5a89c522b2133b9f56eef950031c0f7f2c1))
- remove page transition animations to prevent flashing ([dda8323](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/dda8323b452bd3d3054d5bbdd607ce5c7a27a6a4))
- remove quick actions section and optimize build chunks ([de613d9](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/de613d909d64b4e1853032447df671939ddad9b2))
- remove small discount badge and improve large badge UX ([822b9a6](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/822b9a6265e7c9b14c4ef630e80ee81ef9597496))
- restore page animations, improve checkbox visibility ([5ad5e8d](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/5ad5e8d3657b8074305fd1c8b94cebd5c6cb4af2))
- revert to native Telegram WebApp API, remove SDK usage ([6f8bc4f](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/6f8bc4fca592f074d4705069a48bbaef3e5a105d))
- scroll to start of tariffs section and wait for data to load ([c815ac2](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/c815ac29ea281056908f39dfb6a390b3b201377b))
- UI improvements - reduce Android header, hide mobile scrollbar, disable animations in Telegram, consistent menu overlay ([768b340](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/768b340c35c5f145940bb9966e2e6713039be32f))
- unify card styles across the project ([4a25d8d](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/4a25d8df03b26f25800f882e46223bab64873b73))
- use native Telegram popup for email preview restriction ([7aeb47f](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/7aeb47f583056d651b90db4ed7cad2d2a2aef3b1))
- use pill-style tabs in admin user detail page ([09584fc](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/09584fc901d778453fbda437d643f4bd9c4321e3))
- use RemnaWave icon in admin panel menu ([4034b4d](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/4034b4db3932cab273636bb54bf796aff6de712c))
- use single shared WebSocket connection and optimize build chunks ([f6854c6](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/f6854c6c3aef3ff46d7839dfe94d2ec6bf4d7d64))
- wrap all SDK isSupported() calls in try-catch ([e5ea09d](https://github.com/BEDOLAGA-DEV/bedolaga-cabinet/commit/e5ea09dd3a13ec47ca65de93c6f5858c1fadb135))
