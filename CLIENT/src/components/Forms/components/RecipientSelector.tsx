import { Recipient } from "../types/form";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { ScrollArea } from "../../ui/scroll-area";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";

interface RecipientSelectorProps {
  recipients: Recipient[];
  filteredRecipients: Recipient[];
  selectedRecipients: Set<number>;
  selectAllRecipients: boolean;
  searchTerm: string;
  onToggleRecipient: (id: number) => void;
  onToggleAllRecipients: (checked: boolean) => void;
  onSearchTermChange: (value: string) => void;
  formTarget: string;
}

export function RecipientSelector({
  recipients,
  filteredRecipients,
  selectedRecipients,
  selectAllRecipients,
  searchTerm,
  onToggleRecipient,
  onToggleAllRecipients,
  onSearchTermChange,
  formTarget,
}: RecipientSelectorProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-gray-50"
        >
          <span className="text-sm">
            Preview Recipients ({filteredRecipients.length} of {recipients.length})
          </span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">
        <div className="text-sm text-gray-600">
          <p>
            Recipients for <strong>{formTarget}</strong>.
          </p>
          <p className="mt-2">
            Use the search bar below to exclude specific users.
          </p>
        </div>

        {/* Search Bar */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Search and Exclude Users
          </Label>
          <Input
            placeholder="Search users by name..."
            className="h-9"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            aria-label="Search recipients"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="select-all-recipients"
            type="checkbox"
            checked={selectAllRecipients}
            onChange={(e) => onToggleAllRecipients(e.target.checked)}
            className="w-4 h-4"
            aria-label="Select all recipients"
          />
          <Label htmlFor="select-all-recipients" className="text-sm">
            Send to all users in this group
          </Label>
        </div>

        {/* Recipients list with checkboxes */}
        {filteredRecipients.length > 5 ? (
          <ScrollArea className="border rounded-lg p-3 bg-gray-50 max-h-24">
            {recipients.length > 0 ? (
              <RecipientList
                recipients={filteredRecipients}
                selectedRecipients={selectedRecipients}
                onToggleRecipient={onToggleRecipient}
              />
            ) : (
              <EmptyState searchTerm={searchTerm} />
            )}
          </ScrollArea>
        ) : (
          <div className="border rounded-lg p-3 bg-gray-50">
            {recipients.length > 0 ? (
              <RecipientList
                recipients={filteredRecipients}
                selectedRecipients={selectedRecipients}
                onToggleRecipient={onToggleRecipient}
              />
            ) : (
              <EmptyState searchTerm={searchTerm} />
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface RecipientListProps {
  recipients: Recipient[];
  selectedRecipients: Set<number>;
  onToggleRecipient: (id: number) => void;
}

function RecipientList({
  recipients,
  selectedRecipients,
  onToggleRecipient,
}: RecipientListProps) {
  return (
    <div className="space-y-2">
      {recipients.map((recipient) => (
        <div key={recipient.id} className="flex items-center gap-2">
          <input
            id={`recipient-${recipient.id}`}
            type="checkbox"
            checked={selectedRecipients.has(recipient.id)}
            onChange={() => onToggleRecipient(recipient.id)}
            className="w-4 h-4"
            aria-label={`Select ${recipient.name}`}
          />
          <Label
            htmlFor={`recipient-${recipient.id}`}
            className="text-sm flex-1"
          >
            {recipient.name}{" "}
            <span className="text-gray-500">({recipient.details})</span>
          </Label>
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  searchTerm: string;
}

function EmptyState({ searchTerm }: EmptyStateProps) {
  return (
    <p className="text-xs text-gray-500">
      {searchTerm
        ? `No users found matching "${searchTerm}"`
        : "No users found in this group."}
    </p>
  );
}
