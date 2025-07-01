import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export function ScenarioToolbar() {
    return (
        <div className="flex items-center h-12 gap-4">
            <Button size="sm" variant="default" aria-label="Add Scenario">
                + Add Scenario
            </Button>
            <Button size="sm" variant="default" aria-label="Add Scenario Outline">
                + Add Outline
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" aria-label="Export Scenarios">Export</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>.feature</DropdownMenuItem>
                    <DropdownMenuItem>.json</DropdownMenuItem>
                    <DropdownMenuItem>.pdf</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

ScenarioToolbar.displayName = "ScenarioToolbar";