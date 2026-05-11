window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const game = new window.AetherlineGame(canvas);
  window.__aetherlineGame = game;
  game.start();
});
