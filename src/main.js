import { Game } from './core/Game.js';
import { initIconTheme } from './ui/icons.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
game.start();
initIconTheme();

// Geliştirme sırasında konsoldan erişim için: window.game.state.gold = 1e6
window.game = game;
