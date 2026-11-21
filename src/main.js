import { createClient } from '@supabase/supabase-js';
import { geometryDestination } from './course-navigation';
import './login.css';
import './style.css';
import primaryDesktop from './assets/img/cursos/primaria-desktop.webp';
import secondaryDesktop from './assets/img/cursos/secundaria-desktop.webp';
import primaryTitle from './assets/img/cursos/primaria-titulo.webp';
import secondaryTitle from './assets/img/cursos/secundaria-titulo.webp';
import primaryGeometry from './assets/img/cursos/primaria-geometria.webp';
import secondaryGeometry from './assets/img/cursos/secundaria-geometria.webp';
import primaryArithmetic from './assets/img/cursos/primaria-aritmetica.webp';
import secondaryArithmetic from './assets/img/cursos/secundaria-aritmetica.webp';
import courseHeader from './assets/img/cursos/header.webp';
import homeHeader from './assets/img/header.webp';
const courseAssets = {
  primaria: { name: 'Primaria', desktop: primaryDesktop, title: primaryTitle, geometry: primaryGeometry, arithmetic: primaryArithmetic },
  secundaria: { name: 'Secundaria', desktop: secondaryDesktop, title: secondaryTitle, geometry: secondaryGeometry, arithmetic: secondaryArithmetic },
};
let currentLevel = 'primaria';
const $ = (selector) => document.querySelector(selector);
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
let authenticated = false;
let registering = false;
let sessionVersion = 0;
async function checkAccess(session) {
  const version = ++sessionVersion;
  if (!session) { showSession(null); return; }
  showSession(null);
  $('#loading').hidden = false;
  $('.welcome').hidden = true;
  const { data, error } = await supabase.from('account_access').select('role,status').eq('user_id', session.user.id).maybeSingle();
  if (version !== sessionVersion) return;
  if (error || !data || data.status !== 'active' || !['teacher', 'owner'].includes(data.role)) {
    showSession(null);
    $('#status').textContent = error ? 'No pudimos comprobar tu acceso. Intenta iniciar sesión de nuevo.' : 'Tu cuenta de profesor necesita activación. Contacta al administrador.';
    return;
  }
  showSession(session);
  showHome('home');
}
$('#auth-mode').addEventListener('click', () => {
  registering = !registering;
  $('#login-title').textContent = registering ? 'Registro de profesor' : 'Iniciar sesión';
  $('#submit-label').textContent = registering ? 'Crear cuenta' : 'Iniciar sesión';
  $('#auth-mode').textContent = registering ? 'Ya tengo cuenta · Iniciar sesión' : '¿Eres nuevo? Regístrate como profesor';
  $('#password').autocomplete = registering ? 'new-password' : 'current-password';
  $('#password').minLength = registering ? 8 : 1;
  $('#status').textContent = '';
});
function showSession(session) {
  authenticated = Boolean(session);
  $('#loading').hidden = true;
  $('.welcome').hidden = authenticated;
  $('#student-panel').hidden = !authenticated;
  if (!authenticated) { $('#password').value = ''; $('#notification-panel').hidden = true; }
}
supabase.auth.onAuthStateChange((_event, session) => { setTimeout(() => checkAccess(session), 0); });
async function initialize() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    await checkAccess(data.session);
  } catch {
    showSession(null);
    $('#status').textContent = 'No pudimos comprobar tu sesión. Intenta iniciar sesión de nuevo.';
  }
}
initialize();
$('#toggle-password').addEventListener('click', () => {
  const visible = $('#password').type === 'password';
  $('#password').type = visible ? 'text' : 'password';
  $('#toggle-password').textContent = visible ? 'Ocultar' : 'Ver';
  $('#toggle-password').setAttribute('aria-pressed', String(visible));
  $('#toggle-password').setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
});
$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('.submit');
  button.disabled = true;
  $('#status').textContent = registering ? 'Creando tu cuenta de profesor…' : 'Iniciando sesión…';
  try {
    if (registering) {
      const { data, error } = await supabase.auth.signUp({ email: $('#email').value.trim(), password: $('#password').value, options: { data: { account_type: 'teacher' } } });
      if (error) throw error;
      $('#status').textContent = data.session ? 'Cuenta creada. Contacta al administrador para activar tu acceso como profesor.' : 'Revisa tu correo para confirmar tu cuenta. Luego solicita la activación al administrador.';
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: $('#email').value.trim(), password: $('#password').value });
    if (error) throw error;
    $('#status').textContent = '';
    showHome('home');
  } catch (error) {
    $('#status').textContent = error.code === 'invalid_credentials' ? 'Correo o contraseña incorrectos.' : error.code === 'email_not_confirmed' ? 'Tu cuenta necesita confirmación. Contacta al administrador.' : error.status === 429 ? 'Demasiados intentos. Espera un momento y vuelve a intentar.' : registering ? 'No se pudo crear la cuenta. Revisa los datos o contacta al administrador.' : 'No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.';
  } finally { button.disabled = false; }
});
$('#logout').addEventListener('click', async () => {
  $('#logout').disabled = true;
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    showSession(null);
    $('#status').textContent = 'Cerraste sesión correctamente.';
  } catch { $('#notification-panel').hidden = false; $('#notification-panel').textContent = 'No se pudo cerrar sesión. Vuelve a intentarlo.'; }
  finally { $('#logout').disabled = false; }
});
function showHome(view) {
  if (!authenticated) return;
  $('#home-screen').hidden = false;
  $('#level-screen').hidden = true;
  $('#subject-screen').hidden = true;
  $('#student-panel').classList.remove('course-open');
  $('#panel-header-image').src = homeHeader;
  document.querySelectorAll('[data-view]').forEach(button => {
    if(button.dataset.view === view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showHome(button.dataset.view)));
function showLevel(level) {
  if (!authenticated) return;
  currentLevel = level;
  $('#level-screen').classList.toggle('primary-courses',level==='primaria');
  const assets = courseAssets[level];
  $('#home-screen').hidden = true;
  $('#subject-screen').hidden = true;
  $('#level-screen').hidden = false;
  $('.primary-extra-cards').hidden = level !== 'primaria';
  $('#student-panel').classList.add('course-open');
  $('#panel-header-image').src = courseHeader;
  $('#level-title').textContent = assets.name;
  $('#level-desktop-image').src = assets.desktop;
  $('#level-mobile-title').src = assets.title;
  $('#geometry-image').src = assets.geometry;
  $('#arithmetic-image').src = assets.arithmetic;
  $('.geometry-choice').setAttribute('aria-label', `Geometría · ${assets.name}`);
  $('.arithmetic-choice').setAttribute('aria-label', `Aritmética · ${assets.name}`);
  $('#level-title').focus();
}
document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => showLevel(button.dataset.level)));
document.querySelectorAll('[data-subject]').forEach(button => button.addEventListener('click', () => {
  if (!authenticated) return;
  if (button.dataset.subject === 'aritmetica' && currentLevel === 'primaria') { location.assign('/aritmetica/'); return; }
  if (button.dataset.subject === 'razonamiento' && currentLevel === 'primaria') { location.assign('/boards/razonamiento/'); return; }
  if (button.dataset.subject === 'algebra' && currentLevel === 'primaria') { location.assign('/algebra/'); return; }
  if (button.dataset.subject === 'geometria') { location.assign(geometryDestination(currentLevel)); return; }
  $('#level-screen').hidden = true;
  $('#subject-screen').hidden = false;
  const subjects = {geometria:'Geometría',aritmetica:'Aritmética',razonamiento:'Razonamiento Matemático',algebra:'Álgebra'};
  $('#subject-title').textContent = `${subjects[button.dataset.subject]} · ${courseAssets[currentLevel].name}`;
  $('#subject-title').focus();
}));
$('#subject-back').addEventListener('click', () => showLevel(currentLevel));
$('#back').addEventListener('click', () => showHome('courses'));
$('#notifications').addEventListener('click', () => {
  const open = $('#notification-panel').hidden;
  $('#notification-panel').hidden = !open;
  $('#notifications').setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', event => { if(event.key === 'Escape') { $('#notification-panel').hidden = true; $('#notifications').setAttribute('aria-expanded', 'false'); } });
