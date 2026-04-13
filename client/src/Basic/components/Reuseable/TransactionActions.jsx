const TransactionActions = ({ leftActions = [], rightActions = [] }) => {
  const renderButton = (action, index) => (
    <button
      key={action.key || index}
      type="button"
      onClick={action.onClick}
      onKeyDown={action.onKeyDown}
      disabled={action.disabled}
      className={action.className}
    >
      {action.icon}
      {action.label}
    </button>
  );

  return (
    <div className="mt-4 flex flex-wrap items-start gap-2">
      <div className="flex min-w-0 flex-wrap gap-2">
        {leftActions.map(renderButton)}
      </div>
      <div className="flex min-w-0 flex-wrap gap-2 xl:ml-auto">
        {rightActions.map(renderButton)}
      </div>
    </div>
  );
};

export default TransactionActions;
