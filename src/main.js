import './style.css';
import { Game } from './core/Game.js';

const canvas = document.getElementById('game');
const hudEl = document.getElementById('hud');

const game = new Game(canvas, hudEl);
game.boot();
