import './styles.css';
import { Game } from './game';

const canvas = document.getElementById('game-canvas');
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Game canvas is missing.');
}

const game = new Game(canvas);
const restartButton = document.getElementById('restart-button');
if (!(restartButton instanceof HTMLButtonElement)) {
  throw new Error('Restart button is missing.');
}

restartButton.addEventListener('click', () => game.restart());
game.start();
