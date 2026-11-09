import { ConfirmDialog } from 'frontend';

export const UnsavedChanges = () => (
  <ConfirmDialog
    open
    onOpenChange={() => {}}
    title="You have unsaved changes"
    description="Log out anyway? Changes you haven't saved will be lost."
    cancelLabel="Cancel"
    confirmLabel="Log out"
    tone="danger"
    onConfirm={() => {}}
  />
);

export const SubmitForReview = () => (
  <ConfirmDialog
    open
    onOpenChange={() => {}}
    title="Submit Q4 self-review?"
    description="Your manager will be notified. You can't edit scores after submitting."
    confirmLabel="Submit"
    onConfirm={() => {}}
  />
);
