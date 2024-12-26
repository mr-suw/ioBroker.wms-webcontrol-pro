'use strict';

/**
 * This is a dummy TypeScript test file using chai and mocha
 *
 * It's automatically excluded from npm and its build output is excluded from both git and npm.
 * It is advised to test all your modules with accompanying *.test.js-files
 */

// tslint:disable:no-unused-expression

const { expect } = require('chai');
require('chai').use(require('chai-as-promised'));
const { Time, PauseSchedule } = require('./main.js');

describe('PauseSchedule', () => {
	describe('Overnight pause (22:00-06:00)', () => {
		const pause = new Time('10:00:00 PM');
		const resume = new Time('06:00:00 AM');
		const schedule = new PauseSchedule(pause, resume);

		it('should return false at 21:59 (before pause)', () => {
			const now = new Date('2024-01-01T21:59:00');
			expect(schedule.isInPauseTime(now)).to.be.false;
		});

		it('should return true at 23:00 (during pause)', () => {
			const now = new Date('2024-01-01T23:00:00');
			expect(schedule.isInPauseTime(now)).to.be.true;
		});

		it('should return true at 02:00 (during pause overnight)', () => {
			const now = new Date('2024-01-02T02:00:00');
			expect(schedule.isInPauseTime(now)).to.be.true;
		});
	});

	describe('Same-day pause (15:00-18:00)', () => {
		const pause = new Time('03:00:00 PM');
		const resume = new Time('06:00:00 PM');
		const schedule = new PauseSchedule(pause, resume);

		it('should return false at 14:59 (before pause)', () => {
			const now = new Date('2024-01-01T14:59:00');
			expect(schedule.isInPauseTime(now)).to.be.false;
		});

		it('should return true at 16:30 (during pause)', () => {
			const now = new Date('2024-01-01T16:30:00');
			expect(schedule.isInPauseTime(now)).to.be.true;
		});

		it('should return false at 18:01 (after resume)', () => {
			const now = new Date('2024-01-01T18:01:00');
			expect(schedule.isInPauseTime(now)).to.be.false;
		});
	});

	describe('No pause schedule', () => {
		const pause = null;
		const resume = null;
		const schedule = new PauseSchedule(pause, resume);

		it('should return false at 14:59 (before pause)', () => {
			const now = new Date('2024-01-01T14:59:00');
			expect(schedule.isInPauseTime(now)).to.be.false;
		});
	});
});
