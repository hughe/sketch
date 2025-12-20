import './styles.css';
import './components/app-shell';

// App initialization
console.log('DiffReviewer loading...');

const app = document.getElementById('app');
if (app) {
  app.innerHTML = '<app-shell></app-shell>';
}
