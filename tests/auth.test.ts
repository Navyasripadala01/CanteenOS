import test from 'node:test';
import assert from 'node:assert/strict';

import { useCanteenStore } from '../src/store/canteenStore';
import { DEMO_PERSONAS } from '../src/data/seedData';

test('Demo Auth — 1. Verify Predefined Demo Credentials for all 5 Roles', () => {
  const store = useCanteenStore.getState();
  store.resetToSeedData();

  // Test Student Login
  const studentRes = store.loginWithCredentials('rahul@campus.edu', '1111');
  assert.equal(studentRes.success, true, 'Student login should succeed with valid credentials');
  assert.equal(studentRes.persona?.role, 'STUDENT', 'Persona role should be STUDENT');
  assert.equal(useCanteenStore.getState().isAuthenticated, true, 'Store must reflect isAuthenticated = true');

  // Test Visitor (Alumni Passed-Out) Login
  const alumniRes = store.loginWithCredentials('vikram.alumni@gmail.com', '2022');
  assert.equal(alumniRes.success, true, 'Alumni visitor login should succeed');
  assert.equal(alumniRes.persona?.role, 'VISITOR');
  assert.equal(alumniRes.persona?.visitorType, 'ALUMNI_PASSED_OUT');
  assert.equal(alumniRes.persona?.passoutYear, 2022);

  // Test Visitor (Campus Guest) Login
  const guestRes = store.loginWithCredentials('radhika.guest@outlook.com', '3333');
  assert.equal(guestRes.success, true, 'Guest visitor login should succeed');
  assert.equal(guestRes.persona?.role, 'VISITOR');
  assert.equal(guestRes.persona?.visitorType, 'CAMPUS_GUEST');

  // Test Kitchen Staff Login
  const kitchenRes = store.loginWithCredentials('chef.ramesh@canteen.edu', '4444');
  assert.equal(kitchenRes.success, true, 'Kitchen staff login should succeed');
  assert.equal(kitchenRes.persona?.role, 'KITCHEN_STAFF');

  // Test Pickup Coordinator Login
  const pickupRes = store.loginWithCredentials('priya.pickup@canteen.edu', '5555');
  assert.equal(pickupRes.success, true, 'Pickup coordinator login should succeed');
  assert.equal(pickupRes.persona?.role, 'PICKUP_COORDINATOR');

  // Test College Admin Login
  const adminRes = store.loginWithCredentials('admin.sharma@campus.edu', '9999');
  assert.equal(adminRes.success, true, 'College admin login should succeed');
  assert.equal(adminRes.persona?.role, 'COLLEGE_ADMIN');
});

test('Demo Auth — 2. Rejection of Invalid Credentials', () => {
  const store = useCanteenStore.getState();
  store.logout();

  // Wrong PIN
  const wrongPin = store.loginWithCredentials('rahul@campus.edu', '9999');
  assert.equal(wrongPin.success, false, 'Login must fail with incorrect PIN');
  assert.match(wrongPin.errorMessage!, /Invalid demo identifier or 4-digit PIN/i);
  assert.equal(useCanteenStore.getState().isAuthenticated, false);

  // Unregistered Email
  const wrongEmail = store.loginWithCredentials('unknown@campus.edu', '1111');
  assert.equal(wrongEmail.success, false, 'Login must fail with unknown email');
  assert.equal(useCanteenStore.getState().isAuthenticated, false);
});

test('Demo Auth — 3. 1-Click Quick Login by Persona ID', () => {
  const store = useCanteenStore.getState();
  store.logout();

  const success = store.loginAsPersona('usr-visitor-alumni');
  assert.equal(success, true, '1-Click persona login should succeed');
  assert.equal(useCanteenStore.getState().isAuthenticated, true);
  assert.equal(useCanteenStore.getState().activePersona.id, 'usr-visitor-alumni');
  assert.equal(useCanteenStore.getState().activePersona.role, 'VISITOR');

  // Non-existent persona ID
  const failure = store.loginAsPersona('invalid-persona-id');
  assert.equal(failure, false, 'Invalid persona ID should fail');
});

test('Demo Auth — 4. Logout Session Clearing', () => {
  const store = useCanteenStore.getState();
  store.loginAsPersona('usr-student-rahul');
  assert.equal(useCanteenStore.getState().isAuthenticated, true);

  store.logout();
  assert.equal(useCanteenStore.getState().isAuthenticated, false, 'Logout must clear authenticated state');
});
