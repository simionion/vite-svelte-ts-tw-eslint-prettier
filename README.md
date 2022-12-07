# Svelte + Vite > Featured Shops

## Development

### Install dependencies

Using pnpm or any preferred package manager:

```bash
npm install
```

Runs both dev & test

```javascript
 scripts = {
    "dev": "vite",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "coverage": "vitest run --coverage",
    "build": "npm run lint && vite build",
    "preview": "vite preview",
    "format": "prettier --write 'src/**/*.{css,html,js,ts,svelte}'",
    "lint": "eslint --fix src --ext .js,.ts,.svelte"
}
```

## Recommended IDE Setup

[Webstorm](https://www.jetbrains.com/webstorm/) + [Svelte](https://plugins.jetbrains.com/plugin/12375-svelte) + [ESLint](https://plugins.jetbrains.com/plugin/7494-eslint) + [Prettier](https://plugins.jetbrains.com/plugin/10456-prettier)

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Framework & Tools

- [Vite](https://vitejs.dev/)
- [Svelte](https://svelte.dev/)
- [Vitest](https://vitest.dev/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
