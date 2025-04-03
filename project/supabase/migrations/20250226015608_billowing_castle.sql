/*
  # Create appointments table for barbershop

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `barber_name` (text) - Name of the barber
      - `client_name` (text) - Name of the client
      - `phone_number` (text) - Client's phone number
      - `appointment_time` (timestamptz) - Date and time of the appointment
      - `created_at` (timestamptz) - When the appointment was created
      - `completed` (boolean) - Whether the appointment has been completed
  
  2. Security
    - Enable RLS on `appointments` table
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_name text NOT NULL,
  client_name text NOT NULL,
  phone_number text NOT NULL,
  appointment_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON appointments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access"
  ON appointments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON appointments
  FOR UPDATE
  TO public
  USING (true);