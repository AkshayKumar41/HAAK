"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface EventRequest {
  id: number
  host: string
  eventTitle: string
  location: string
  date: string
  rsvps: number
  status: string
}

interface EventRequestsTableProps {
  data: EventRequest[]
}

export function EventRequestsTable({ data }: EventRequestsTableProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="font-semibold text-foreground">Host</TableHead>
            <TableHead className="font-semibold text-foreground">Event title</TableHead>
            <TableHead className="font-semibold text-foreground">Location</TableHead>
            <TableHead className="font-semibold text-foreground">Date</TableHead>
            <TableHead className="font-semibold text-foreground">Anticipated RSVP's</TableHead>
            <TableHead className="font-semibold text-foreground">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow key={request.id} className="border-t border-border">
              <TableCell>{request.host}</TableCell>
              <TableCell>{request.eventTitle}</TableCell>
              <TableCell>{request.location}</TableCell>
              <TableCell>{request.date}</TableCell>
              <TableCell>{request.rsvps}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button className="bg-pink-500 hover:bg-pink-600 text-white text-xs px-3 py-1 h-auto">Accept</Button>
                  <Button variant="outline" className="text-xs px-3 py-1 h-auto bg-transparent">
                    Deny
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
