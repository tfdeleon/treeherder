import React from 'react';
import { render, waitFor, cleanup, fireEvent } from '@testing-library/react';

import testAlertSummaries from '../../mock/alert_summaries';
import testPerformanceTags from '../../mock/performance_tags';
import repos from '../../mock/repositories';
import StatusDropdown from '../../../../ui/perfherder/alerts/StatusDropdown';
import issueTrackers from '../../../../treeherder/perf/fixtures/issue_tracker';

let testAlertSummary = testAlertSummaries[0];
const testAlerts = testAlertSummary.alerts;
const testRepoModel = repos[2];

const testUser = {
  username: 'mozilla-ldap/test_user@mozilla.com',
  isLoggedIn: true,
  isStaff: true,
  email: 'test_user@mozilla.com',
};

const dummyFrameworkName = 'someTestFramework';
const testIssueTrackers = issueTrackers.map((issue) => ({
  id: issue.pk,
  issueTrackerUrl: issue.fields.name,
  text: issue.fields.task_base_url,
}));

const testStatusDropdown = (summaryTags, alertSummary) => {
  testAlertSummary.performance_tags = summaryTags;

  if (alertSummary) {
    testAlertSummary = alertSummary;
  }

  return render(
    <StatusDropdown
      alertSummary={testAlertSummary}
      user={testUser}
      updateState={() => {}}
      repoModel={testRepoModel}
      updateViewState={() => {}}
      issueTrackers={testIssueTrackers}
      bugTemplate={null}
      filteredAlerts={testAlerts}
      performanceTags={testPerformanceTags}
      frameworks={[{ id: 1, name: dummyFrameworkName }]}
    />,
  );
};

afterEach(cleanup);

test("Summary with no tags shows 'Add tags'", async () => {
  const { getByText } = testStatusDropdown([]);

  const dropdownItem = await waitFor(() => getByText('Add tags'));

  expect(dropdownItem).toBeInTheDocument();
});

test("Summary with tags shows 'Edit tags'", async () => {
  const { getByText } = testStatusDropdown(['harness']);

  const dropdownItem = await waitFor(() => getByText('Edit tags'));

  expect(dropdownItem).toBeInTheDocument();
});

test("Tags modal opens from 'Add tags'", async () => {
  const { getByText, getByTestId } = testStatusDropdown([]);

  const dropdownItem = await waitFor(() => getByText('Add tags'));

  fireEvent.click(dropdownItem);

  const modal = await waitFor(() => getByTestId('tags-modal'));

  expect(modal).toBeInTheDocument();
});

test("Tags modal opens from 'Edit tags'", async () => {
  const { getByText, getByTestId } = testStatusDropdown(['harness']);

  const dropdownItem = await waitFor(() => getByText('Edit tags'));

  fireEvent.click(dropdownItem);

  const modal = await waitFor(() => getByTestId('tags-modal'));

  expect(modal).toBeInTheDocument();
});

test('Showing Today status when Due date day is the same as current day and alert is created on Wednesday', async () => {
  const alert = testAlertSummaries[0];

  // created date day is set to Wednesday
  alert.created = '2022-02-09T11:41:31.419156';
  alert.triage_due_date = '2022-02-14T11:41:31.419156';

  // current day is set to equal due date which is calculated to be Monday
  Date.now = jest.fn(() => Date.parse('2022-02-14T11:41:31.419156'));

  const { getByTestId } = testStatusDropdown([], alert);
  const dueDateIcon = await waitFor(() => getByTestId('triage-clock-icon'));

  fireEvent.mouseOver(dueDateIcon);

  const dueDateStatus = await waitFor(() => getByTestId('due-date-status'));
  const dueDateStatusText = dueDateStatus.querySelector('span').innerHTML;
  expect(dueDateStatusText.slice(0, 10)).toBe('Hours left');
});

// by showing Hours left status we know that the due date was calculated correctly

test('Triage to countdown shows nothing when the website is accessed during the weekend', async () => {
  const alert = testAlertSummaries[0];

  // created date day is set to Thursday
  alert.created = '2022-02-10T11:41:31.419156';

  // current day is set to Sunday
  Date.now = jest.fn(() => Date.parse('2022-02-13T11:41:31.419156'));

  const { getByTestId } = testStatusDropdown([], alert);
  const dueDateContainer = await waitFor(() => getByTestId('triage-due-date'));
  expect(dueDateContainer.childNodes).toHaveLength(0);
});
