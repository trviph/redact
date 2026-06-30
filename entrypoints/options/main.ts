import { mount } from 'svelte';
import { initLocale } from '../../src/i18n';
import App from './App.svelte';

void initLocale();
mount(App, { target: document.getElementById('app')! });
