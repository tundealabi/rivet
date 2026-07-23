import {
  type IssueDetailActions,
  IssueDetailContext,
} from "./issue-detail-actions";

export function IssueDetailProvider({
  value,
  children,
}: {
  value: IssueDetailActions;
  children: React.ReactNode;
}) {
  return (
    <IssueDetailContext.Provider value={value}>
      {children}
    </IssueDetailContext.Provider>
  );
}
