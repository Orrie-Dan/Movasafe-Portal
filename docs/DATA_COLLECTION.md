# Data Collection Documentation
## Waste Management System - Admin Dashboard

This document outlines the comprehensive data collection strategy for all admin dashboard pages in the Waste Management System (WMS).

---

## Table of Contents

1. [Overview](#overview)
2. [Data Collection Architecture](#data-collection-architecture)
3. [Waste Collections Data](#waste-collections-data)
4. [Zones & Routes Data](#zones--routes-data)
5. [Recycling Data](#recycling-data)
6. [Waste Types Data](#waste-types-data)
7. [Facility Operations Data](#facility-operations-data)
8. [Service Subscriptions & Payments](#service-subscriptions--payments)
9. [Regulatory Compliance Data](#regulatory-compliance-data)
10. [Data Flow Diagrams](#data-flow-diagrams)
11. [API Endpoints Specification](#api-endpoints-specification)
12. [Data Models & Schemas](#data-models--schemas)
13. [Real-time vs Batch Collection](#real-time-vs-batch-collection)
14. [Data Validation & Quality](#data-validation--quality)
15. [Implementation Roadmap](#implementation-roadmap)
16. [Appendix: Rwanda-Specific Data Collection Examples](#appendix-rwanda-specific-data-collection-examples)

---

## Overview

The WMS admin dashboard requires data from multiple sources to provide comprehensive insights into waste management operations. Data collection is designed to be:

- **Real-time**: For operational data (collections, routes, status updates)
- **Batch**: For analytics and reporting (daily/weekly aggregations)
- **Event-driven**: For status changes and notifications
- **Scheduled**: For periodic metrics and trends

### Rwanda-Specific Context

The WMS is designed for Rwanda's waste management ecosystem, which includes:

**Stakeholders:**
- Private waste collection companies
- Community-Based Organizations (CBOs)
- Cooperatives
- Licensed service providers (regulated by RURA - Rwanda Utilities Regulatory Authority)
- Municipal authorities (Kigali City Council, secondary city councils)

**Key Infrastructure:**
- **Nduba Landfill (Kigali)** - Main waste processing facility
  - Waste sorting and separation facility (~100 tons/day capacity)
  - Bio-waste treatment facility (organic fertilizer production)
  - Weighbridge and transfer stations
- **E-waste collection points and facilities** (e.g., Enviroserve Rwanda)
- **Material recovery facilities**
- **Composting facilities** (cooperatives and treatment centers)

**Collection Patterns:**
- **Urban areas (Kigali)**: Weekly household pickups, daily/near-daily public space cleaning
- **Smart waste bins** in designated neighborhoods
- **Market waste collection** (high organic content)
- **Institutional and commercial waste** collection
- **Rural areas**: Varies by region (composting, informal disposal, landfilling)

**Waste Composition:**
- High organic waste percentage (especially from residential and markets) - 60-70%
- Plastics - 10-15%
- Paper - 5-8%
- Metals - 2-5%
- Glass - 1-3%
- E-waste - <1% (growing)
- Hazardous waste - <1%
- Other - 5-10%

**Regulatory Framework:**
- National Sanitation Policy
- Waste Management Regulations
- RURA licensing and compliance
- Source segregation requirements
- Hazardous waste disposal regulations

### Data Sources

1. **Private Collection Companies**
   - Collection vehicles with GPS tracking
   - Collection schedules and routes
   - Service subscriptions (households, businesses)
   - Payment records

2. **CBOs and Cooperatives**
   - Community collection activities
   - Composting operations
   - Local waste sorting initiatives

3. **Mobile Applications** (Collection officers/drivers)
   - Collection start/completion events
   - GPS location tracking
   - Photo uploads (before/after collection)
   - Weight measurements (at weighbridge)
   - Waste type categorization

4. **Smart Bin Networks** (in designated neighborhoods)
   - Fill level sensors
   - Collection triggers
   - Bin location tracking

5. **Facility Systems**
   - Nduba Landfill operations
   - Sorting facility data
   - Bio-waste treatment facility metrics
   - E-waste collection points
   - Material recovery facilities

6. **Regulatory Systems** (RURA)
   - Service provider licenses
   - Compliance data
   - Regulatory reporting

7. **Web Applications** (Admin/Officer dashboards)
   - Manual data entry
   - Configuration management
   - Reporting interfaces

---

## Data Collection Architecture

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Mobile Apps    │────▶│   API Gateway   │────▶│  Data Processor  │
│  (Officers)     │     │   (REST/GraphQL) │     │  (Validation)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
┌─────────────────┐     ┌─────────────────┐             │
│  IoT Sensors    │────▶│  Message Queue   │─────────────┘
│  (Smart Bins)   │     │  (RabbitMQ/Kafka)│
└─────────────────┘     └─────────────────┘
                                                          │
┌─────────────────┐     ┌─────────────────┐             │
│  Web Dashboard  │────▶│   WebSocket     │─────────────┘
│  (Real-time)    │     │   Server        │
└─────────────────┘     └─────────────────┘
                                                          │
                                                        ▼
                                              ┌─────────────────┐
                                              │   Database      │
                                              │  (PostgreSQL)   │
                                              └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │  Analytics DB   │
                                              │  (TimescaleDB)  │
                                              └─────────────────┘
```

### Technology Stack

- **API Layer**: REST API (Express.js/Fastify) + GraphQL (optional)
- **Message Queue**: RabbitMQ or Apache Kafka for event streaming
- **Database**: PostgreSQL (primary), TimescaleDB (time-series analytics)
- **Cache**: Redis (real-time data, session management)
- **WebSocket**: Socket.io or WebSocket API (real-time updates)

---

## Waste Collections Data

### Collection Types in Rwanda

1. **Household Collections**
   - Weekly scheduled pickups
   - Subscription-based service
   - Payment tracking
   - Service area coverage

2. **Public Space Collections**
   - Daily/near-daily in high-traffic areas
   - Street cleaning operations
   - Public bin emptying
   - Market waste collection

3. **Commercial/Institutional Collections**
   - Businesses
   - Schools, hospitals, government buildings
   - Markets (high organic waste)

4. **Smart Bin Collections**
   - Sensor-triggered collections
   - Designated neighborhood networks
   - Fill-level based scheduling

5. **Special Collections**
   - E-waste (designated collection points)
   - Hazardous waste (regulated disposal)
   - Bulk waste

### Data Sources

1. **Private Collection Companies**
   - Collection vehicles with GPS tracking
   - Collection schedules and routes
   - Service subscriptions (households, businesses)
   - Payment records

2. **CBOs and Cooperatives**
   - Community collection activities
   - Composting operations
   - Local waste sorting initiatives

3. **Officer Mobile App**
   - Collection start/completion events
   - GPS location tracking
   - Photo uploads
   - Weight measurements (at weighbridge)
   - Waste type categorization

4. **Smart Bin Sensors** (in designated neighborhoods)
   - Fill level data
   - Collection triggers
   - Bin location

5. **Scheduling System**
   - Planned collections
   - Route assignments
   - Time windows

6. **Weighbridge Systems** (Nduba Landfill)
   - Incoming waste weight
   - Vehicle tracking
   - Source identification

### Collection Methods

#### Real-time Collection

**Event: Collection Started**
```json
{
  "event": "collection.started",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "collectionId": "col-12345",
    "officerId": "officer-001",
    "routeId": "route-001",
    "location": {
      "latitude": -1.9441,
      "longitude": 30.0619,
      "address": "KG 123 St, Kigali"
    },
    "scheduledTime": "2024-01-15T10:00:00Z",
    "actualStartTime": "2024-01-15T10:30:00Z"
  }
}
```

**Event: Collection Completed**
```json
{
  "event": "collection.completed",
  "timestamp": "2024-01-15T11:15:00Z",
  "data": {
    "collectionId": "col-12345",
    "officerId": "officer-001",
    "completionTime": "2024-01-15T11:15:00Z",
    "wasteData": {
      "totalWeight": 125.5,
      "unit": "kg",
      "wasteTypes": [
        { "type": "organic", "weight": 45.2 },
        { "type": "plastic", "weight": 30.1 },
        { "type": "paper", "weight": 25.3 },
        { "type": "other", "weight": 24.9 }
      ]
    },
    "photos": ["photo-url-1", "photo-url-2"],
    "notes": "Collection completed successfully"
  }
}
```

**Event: Collection Missed**
```json
{
  "event": "collection.missed",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "collectionId": "col-12346",
    "scheduledTime": "2024-01-15T11:00:00Z",
    "reason": "bin_not_accessible",
    "rescheduledFor": "2024-01-16T11:00:00Z"
  }
}
```

#### Batch Collection

**Daily Aggregation** (runs at 00:00 UTC)
- Total collections completed
- Collections by status
- Collections by waste type
- Average collection time
- Missed collections count

**API Endpoint**: `GET /api/collections/stats?date=2024-01-15`

**Event: Market Collection Completed**
```json
{
  "event": "market.collection.completed",
  "timestamp": "2024-01-15T08:00:00Z",
  "data": {
    "marketId": "kimisagara-market",
    "location": {
      "sector": "Nyarugenge",
      "district": "Nyarugenge",
      "province": "Kigali City"
    },
    "collectionData": {
      "totalWeight": 3.5, // tons
      "organicWaste": 2.8, // tons (80% typical)
      "otherWaste": 0.7,
      "collectionTime": 45 // minutes
    },
    "vendorCount": 250,
    "segregationRate": 60 // percentage of vendors segregating
  }
}
```

### Data Schema

```typescript
interface Collection {
  id: string
  collectionNumber: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
  
  // Location
  location: {
    latitude: number
    longitude: number
    address: string
    province: string
    district: string
    sector: string
    zoneId: string
    routeId: string
  }
  
  // Collection Type
  collectionType: 'household' | 'public_space' | 'commercial' | 'institutional' | 'market' | 'smart_bin' | 'special'
  
  // Source
  source: {
    type: 'household' | 'business' | 'market' | 'public_space' | 'institution'
    subscriptionId?: string // for household/business collections
    marketId?: string // for market collections
  }
  
  // Scheduling
  scheduledTime: string
  actualStartTime?: string
  actualEndTime?: string
  estimatedDuration?: number // minutes
  
  // Assignment
  assignedOfficer: {
    id: string
    name: string
    vehicleId?: string
  }
  
  // Waste Data
  wasteData: {
    totalWeight: number
    unit: 'kg' | 'tons'
    wasteTypes: Array<{
      type: string
      weight: number
    }>
  }
  
  // Metadata
  photos?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections` | List collections with filters |
| GET | `/api/collections/:id` | Get collection details |
| POST | `/api/collections` | Create new collection |
| PUT | `/api/collections/:id` | Update collection |
| PATCH | `/api/collections/:id/status` | Update collection status |
| GET | `/api/collections/stats` | Get collection statistics |
| GET | `/api/collections/today` | Get today's collections |
| GET | `/api/collections/by-date-range` | Get collections by date range |

---

## Zones & Routes Data

### Rwanda Geographic Structure

**Administrative Hierarchy:**
- 5 Provinces (Kigali City, Eastern, Northern, Southern, Western)
- 30 Districts total
- 416 Sectors total
- Cells
- Villages

**Zone Definition:**
Zones in the WMS map to:
- Sectors (primary zone level)
- Districts (for larger operations)
- Custom zones (for service provider coverage areas)

**Route Planning:**
- Urban routes (Kigali): Dense, frequent collections
- Secondary city routes: Less frequent, longer distances
- Rural routes: Varies by accessibility and population density

### Data Sources

1. **Geographic Information System (GIS)**
   - Province, district, sector boundaries
   - Zone definitions
   - Route paths
   - Administrative boundaries (Rwanda administrative structure)

2. **Admin Configuration**
   - Zone creation/editing
   - Route planning
   - Coverage area definitions
   - Service provider area assignments

3. **Route Optimization Engine**
   - Optimal route calculations
   - Efficiency metrics
   - Distance/time estimates
   - Traffic considerations (Kigali-specific)

4. **GPS Tracking**
   - Real-time vehicle positions
   - Route adherence
   - Deviation alerts

### Collection Methods

#### Real-time Collection

**Event: Zone Created/Updated**
```json
{
  "event": "zone.updated",
  "timestamp": "2024-01-15T09:00:00Z",
  "data": {
    "zoneId": "zone-001",
    "name": "Kigali City Zone A",
    "boundaries": {
      "type": "Polygon",
      "coordinates": [[[lat, lng], ...]]
    },
    "coverage": {
      "area": 12.5, // km²
      "population": 50000,
      "households": 12500
    },
    "routes": ["route-001", "route-002"],
    "status": "active"
  }
}
```

**Event: Route Efficiency Calculated**
```json
{
  "event": "route.efficiency.calculated",
  "timestamp": "2024-01-15T18:00:00Z",
  "data": {
    "routeId": "route-001",
    "date": "2024-01-15",
    "metrics": {
      "efficiency": 85.5,
      "distanceTraveled": 45.2, // km
      "collectionsCompleted": 12,
      "estimatedTime": 240, // minutes
      "actualTime": 210, // minutes
      "fuelConsumption": 18.5 // liters
    }
  }
}
```

#### Batch Collection

**Daily Route Performance** (runs at 23:59 UTC)
- Calculate route efficiency
- Update average metrics
- Identify optimization opportunities

### Data Schema

```typescript
interface Zone {
  id: string
  name: string
  code: string
  
  // Geographic Data
  province: string
  district: string
  sector: string
  boundaries: {
    type: 'Polygon'
    coordinates: number[][][]
  }
  
  // Coverage Metrics
  coverage: {
    area: number // km²
    population: number
    households: number
    coveragePercentage: number
  }
  
  // Associated Data
  routes: string[] // route IDs
  collections: number
  status: 'active' | 'inactive'
  
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface Route {
  id: string
  name: string
  code: string
  zoneId: string
  
  // Route Definition
  waypoints: Array<{
    order: number
    location: {
      latitude: number
      longitude: number
      address: string
    }
    estimatedTime: number // minutes from start
  }>
  
  // Assignment
  assignedOfficer?: {
    id: string
    name: string
  }
  vehicleId?: string
  
  // Performance Metrics
  efficiency: number // percentage
  averageDistance: number // km
  averageTime: number // minutes
  collectionsCount: number
  
  // Status
  status: 'active' | 'inactive'
  lastRunDate?: string
  
  // Metadata
  createdAt: string
  updatedAt: string
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/zones` | List all zones |
| GET | `/api/zones/:id` | Get zone details |
| POST | `/api/zones` | Create new zone |
| PUT | `/api/zones/:id` | Update zone |
| DELETE | `/api/zones/:id` | Delete zone |
| GET | `/api/routes` | List all routes |
| GET | `/api/routes/:id` | Get route details |
| POST | `/api/routes` | Create new route |
| PUT | `/api/routes/:id` | Update route |
| GET | `/api/routes/:id/efficiency` | Get route efficiency metrics |
| POST | `/api/routes/optimize` | Optimize route |

---

## Recycling Data

### Rwanda-Specific Recycling Context

**Recycling Infrastructure:**
- **Plastic recycling**: Conversion to building materials (eco-bricks, pavers)
- **Metal recycling**: Recovery and reuse
- **Organic waste**: Composting and biogas generation (cooperatives and facilities)
- **E-waste**: Specialized collection and processing (Enviroserve Rwanda)
- **Paper/Glass**: Limited but growing infrastructure

**Recycling Stakeholders:**
- Private recyclers (often informal/semi-formal)
- Cooperatives (especially for organic waste/composting)
- Specialized firms (e-waste: Enviroserve)
- Material recovery facilities
- Nduba sorting facility

**Collection Methods:**
- Source segregation (encouraged by policy)
- Sorting at facilities (Nduba sorting facility)
- Informal collection networks
- Designated collection points (e-waste)

### Data Sources

1. **Collection Events**
   - Waste type categorization
   - Weight measurements
   - Recycling facility receipts

2. **Recycling Facilities**
   - Material acceptance confirmations
   - Processing volumes
   - Quality assessments
   - Nduba sorting facility operations

3. **Environmental Impact Calculator**
   - CO2 savings
   - Water savings
   - Energy savings
   - Tree equivalents

4. **Composting Facilities**
   - Organic waste processing
   - Compost production volumes
   - Bio-waste treatment facility (Nduba)
   - Cooperative composting operations

5. **E-Waste Facilities**
   - Enviroserve Rwanda operations
   - E-waste collection points
   - Processing and remanufacturing

### Collection Methods

#### Real-time Collection

**Event: Material Recycled**
```json
{
  "event": "material.recycled",
  "timestamp": "2024-01-15T14:30:00Z",
  "data": {
    "collectionId": "col-12345",
    "materialType": "plastic",
    "weight": 30.5, // kg
    "facilityId": "facility-001",
    "facilityName": "Kigali Recycling Center",
    "environmentalImpact": {
      "co2Saved": 12.5, // kg CO2
      "waterSaved": 125.0, // liters
      "energySaved": 45.2 // kWh
    }
  }
}
```

**Event: Composting Completed**
```json
{
  "event": "composting.completed",
  "timestamp": "2024-01-15T16:00:00Z",
  "data": {
    "batchId": "compost-batch-001",
    "organicWasteWeight": 500.0, // kg
    "compostProduced": 250.0, // kg
    "facilityId": "nduba-bio-treatment" | "cooperative-compost-001",
    "facilityType": "centralized" | "cooperative",
    "qualityGrade": "A" | "B" | "C"
  }
}
```

**Event: E-Waste Collected**
```json
{
  "event": "ewaste.collected",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "collectionPointId": "ewaste-point-001",
    "facilityId": "enviroserve-rwanda",
    "items": [
      {
        "category": "electronics",
        "type": "mobile_phone" | "computer" | "appliance",
        "weight": 2.5, // kg
        "condition": "working" | "broken" | "parts_only"
      }
    ],
    "totalWeight": 15.5,
    "collectedBy": "dropoff" | "pickup"
  }
}
```

#### Batch Collection

**Monthly Recycling Report** (runs on 1st of each month)
- Total recycled materials by type
- Recycling rate calculation
- Waste diversion statistics
- Environmental impact summary

### Data Schema

```typescript
interface RecyclingRecord {
  id: string
  collectionId: string
  materialType: string
  weight: number
  unit: 'kg' | 'tons'
  
  // Facility Information
  facility: {
    id: string
    name: string
    type: 'recycling' | 'composting'
  }
  
  // Environmental Impact
  environmentalImpact: {
    co2Saved: number // kg CO2
    waterSaved: number // liters
    energySaved: number // kWh
    treesSaved: number
  }
  
  // Processing
  processedAt: string
  qualityGrade?: 'A' | 'B' | 'C'
  
  createdAt: string
}

interface RecyclingMetrics {
  period: {
    start: string
    end: string
    type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  }
  
  // Overall Metrics
  totalRecycled: number // tons
  totalDiverted: number // tons
  recyclingRate: number // percentage
  compostingRate: number // percentage
  
  // By Material Type
  byMaterial: Array<{
    type: string
    recycled: number
    total: number
    rate: number
  }>
  
  // Environmental Impact
  environmentalImpact: {
    totalCo2Saved: number
    totalWaterSaved: number
    totalEnergySaved: number
    totalTreesSaved: number
  }
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recycling/records` | List recycling records |
| GET | `/api/recycling/metrics` | Get recycling metrics |
| GET | `/api/recycling/trends` | Get recycling trends |
| GET | `/api/recycling/by-category` | Get recycling by category |
| GET | `/api/recycling/environmental-impact` | Get environmental impact |
| POST | `/api/recycling/records` | Record recycling event |

---

## Waste Types Data

### Rwanda Waste Composition

**Typical Waste Composition:**
- **Organic waste**: 60-70% (especially residential and markets)
- **Plastics**: 10-15%
- **Paper**: 5-8%
- **Metals**: 2-5%
- **Glass**: 1-3%
- **E-waste**: <1% (growing)
- **Hazardous**: <1%
- **Other**: 5-10%

**Waste Type Priorities:**
1. Organic (high volume, composting/biogas potential)
2. Plastics (recycling to building materials)
3. E-waste (regulated, specialized handling)
4. Metals (recovery value)
5. Paper/Glass (limited infrastructure)

### Data Sources

1. **Collection Events**
   - Waste type categorization during collection
   - Weight by type
   - Source-based composition (household vs market vs commercial)

2. **Admin Configuration**
   - Waste type definitions
   - Type metadata (colors, icons, descriptions)
   - Recycling capabilities

3. **Analytics Engine**
   - Aggregated statistics
   - Trend calculations
   - Composition analysis by source type

### Collection Methods

#### Real-time Collection

**Event: Waste Type Categorized**
```json
{
  "event": "waste.type.categorized",
  "timestamp": "2024-01-15T11:15:00Z",
  "data": {
    "collectionId": "col-12345",
    "wasteTypes": [
      { "type": "organic", "weight": 45.2 },
      { "type": "plastic", "weight": 30.1 },
      { "type": "paper", "weight": 25.3 }
    ]
  }
}
```

#### Batch Collection

**Daily Aggregation** (runs at 00:00 UTC)
- Total collections by waste type
- Total weight by waste type
- Average weight per collection
- Trend calculations (up/down/stable)

### Data Schema

```typescript
interface WasteType {
  id: string
  type: string // 'organic', 'plastic', 'paper', etc.
  displayName: string
  description?: string
  
  // Configuration
  color: string // hex color
  icon: string // icon identifier
  isRecyclable: boolean
  isHazardous: boolean
  
  // Statistics (calculated)
  statistics: {
    totalCollections: number
    totalWeight: number // tons
    averageWeight: number // kg per collection
    trend: 'up' | 'down' | 'stable'
    trendPercent: number
  }
  
  // Metadata
  createdAt: string
  updatedAt: string
  isActive: boolean
}

interface WasteTypeStats {
  period: {
    start: string
    end: string
  }
  
  types: Array<{
    type: string
    displayName: string
    totalCollections: number
    totalWeight: number
    averageWeight: number
    trend: 'up' | 'down' | 'stable'
    trendPercent: number
  }>
  
  totals: {
    totalTypes: number
    totalCollections: number
    totalWeight: number
    averageCollections: number
  }
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/waste-types` | List all waste types |
| GET | `/api/waste-types/:id` | Get waste type details |
| POST | `/api/waste-types` | Create new waste type |
| PUT | `/api/waste-types/:id` | Update waste type |
| DELETE | `/api/waste-types/:id` | Delete waste type |
| GET | `/api/waste-types/stats` | Get waste type statistics |
| GET | `/api/waste-types/:id/stats` | Get statistics for specific type |

---

## Facility Operations Data

### Nduba Landfill Operations

**Data Sources:**
- Weighbridge system (incoming waste)
- Sorting facility operations
- Bio-waste treatment facility
- Transfer station operations

**Collection Events:**

**Event: Waste Received at Landfill**
```json
{
  "event": "landfill.waste.received",
  "timestamp": "2024-01-15T14:30:00Z",
  "data": {
    "facilityId": "nduba-landfill",
    "weighbridgeId": "wb-001",
    "vehicleId": "vehicle-123",
    "collectionId": "col-12345",
    "totalWeight": 2.5, // tons
    "source": "household" | "commercial" | "public_space" | "market",
    "wasteTypes": {
      "organic": 1.2,
      "plastic": 0.5,
      "paper": 0.3,
      "other": 0.5
    },
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

**Event: Waste Sorted**
```json
{
  "event": "facility.waste.sorted",
  "timestamp": "2024-01-15T15:00:00Z",
  "data": {
    "facilityId": "nduba-sorting-facility",
    "batchId": "batch-001",
    "inputWeight": 100.0, // tons
    "sortedOutput": {
      "recyclable": 25.0,
      "organic": 50.0,
      "residual": 25.0
    },
    "processingTime": 120 // minutes
  }
}
```

**Event: Organic Waste Processed**
```json
{
  "event": "facility.organic.processed",
  "timestamp": "2024-01-15T16:00:00Z",
  "data": {
    "facilityId": "nduba-bio-treatment",
    "batchId": "compost-batch-001",
    "inputWeight": 50.0, // tons organic waste
    "outputWeight": 25.0, // tons compost/fertilizer
    "processingMethod": "composting" | "biogas",
    "qualityGrade": "A" | "B" | "C"
  }
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/facilities/nduba/operations` | Get Nduba facility operations |
| GET | `/api/facilities/nduba/weighbridge` | Get weighbridge data |
| GET | `/api/facilities/nduba/sorting` | Get sorting facility data |
| GET | `/api/facilities/nduba/bio-treatment` | Get bio-treatment facility data |
| POST | `/api/facilities/nduba/waste-received` | Record waste received |
| POST | `/api/facilities/nduba/waste-sorted` | Record sorting operation |

---

## Service Subscriptions & Payments

### Household/Business Subscriptions

**Data Collection:**
- Subscription registration
- Payment records
- Service delivery tracking
- Customer satisfaction

**Event: Subscription Created**
```json
{
  "event": "subscription.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "subscriptionId": "sub-001",
    "customerType": "household" | "business" | "institution",
    "location": {
      "province": "Kigali City",
      "district": "Nyarugenge",
      "sector": "Nyarugenge",
      "address": "KG 123 St"
    },
    "serviceProviderId": "provider-001",
    "collectionFrequency": "weekly" | "biweekly" | "daily",
    "paymentPlan": "monthly" | "quarterly" | "annual",
    "status": "active" | "suspended" | "cancelled"
  }
}
```

**Event: Payment Received**
```json
{
  "event": "payment.received",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "subscriptionId": "sub-001",
    "amount": 5000, // RWF
    "paymentMethod": "mobile_money" | "bank_transfer" | "cash",
    "period": "2024-01",
    "status": "completed"
  }
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | List subscriptions |
| POST | `/api/subscriptions` | Create subscription |
| GET | `/api/subscriptions/:id` | Get subscription details |
| PUT | `/api/subscriptions/:id` | Update subscription |
| GET | `/api/subscriptions/:id/payments` | Get payment history |
| POST | `/api/subscriptions/:id/payments` | Record payment |

---

## Regulatory Compliance Data

### RURA (Rwanda Utilities Regulatory Authority) Reporting

**Required Data:**
- Service provider licenses and status
- Service coverage areas
- Collection volumes by provider
- Compliance metrics
- Customer complaints and resolution

**Collection Events:**

**Event: Service Provider Registered**
```json
{
  "event": "provider.registered",
  "timestamp": "2024-01-15T09:00:00Z",
  "data": {
    "providerId": "provider-001",
    "name": "Kigali Waste Services Ltd",
    "type": "private_company" | "cbo" | "cooperative",
    "ruraLicense": "RURA-LIC-2024-001",
    "serviceAreas": ["zone-001", "zone-002"],
    "status": "active" | "suspended" | "revoked"
  }
}
```

**Event: Compliance Check**
```json
{
  "event": "compliance.checked",
  "timestamp": "2024-01-15T17:00:00Z",
  "data": {
    "providerId": "provider-001",
    "checkDate": "2024-01-15",
    "metrics": {
      "serviceCoverage": 95.5, // percentage
      "collectionRate": 98.2, // percentage
      "customerSatisfaction": 4.2, // out of 5
      "complaints": 5,
      "resolvedComplaints": 5
    },
    "status": "compliant" | "non_compliant" | "warning"
  }
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers` | List service providers |
| GET | `/api/providers/:id` | Get provider details |
| GET | `/api/providers/:id/compliance` | Get compliance data |
| POST | `/api/providers/:id/compliance-check` | Perform compliance check |
| GET | `/api/rura/reports` | Generate RURA reports |

---

## Data Flow Diagrams

### Waste Collections Data Flow

```
┌──────────────┐
│ Officer App  │
│  (Mobile)    │
└──────┬───────┘
       │
       │ POST /api/collections/start
       ▼
┌──────────────┐
│  API Server  │
└──────┬───────┘
       │
       │ Validate & Store
       ▼
┌──────────────┐     ┌──────────────┐
│  Database    │────▶│   Cache      │
│ (PostgreSQL) │     │   (Redis)    │
└──────┬───────┘     └──────┬──────┘
       │                    │
       │                    │ WebSocket Push
       │                    ▼
       │            ┌──────────────┐
       │            │ Admin        │
       │            │ Dashboard    │
       │            └──────────────┘
       │
       │ Daily Aggregation
       ▼
┌──────────────┐
│ Analytics DB│
│(TimescaleDB) │
└──────────────┘
```

### Recycling Data Flow

```
┌──────────────┐
│ Collection   │
│   Event      │
└──────┬───────┘
       │
       │ Material Type + Weight
       ▼
┌──────────────┐
│  Processor   │
│  (Calculate  │
│   Impact)    │
└──────┬───────┘
       │
       │ Store Record
       ▼
┌──────────────┐
│  Database    │
└──────┬───────┘
       │
       │ Aggregate
       ▼
┌──────────────┐
│  Metrics     │
│  (Monthly)   │
└──────────────┘
```

---

## API Endpoints Specification

### Base URL
```
Production: https://api.wms.rw
Development: http://localhost:3000/api
```

### Authentication
All endpoints require authentication via JWT token:
```
Authorization: Bearer <token>
```

### Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 25, max: 100) |
| `sort` | string | Sort field |
| `order` | string | Sort order ('asc' or 'desc') |
| `startDate` | string | Start date (ISO 8601) |
| `endDate` | string | End date (ISO 8601) |

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "totalPages": 4
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

---

## Data Models & Schemas

### Database Schema (PostgreSQL)

#### Collections Table
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL,
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  province VARCHAR(100),
  district VARCHAR(100),
  sector VARCHAR(100),
  zone_id UUID REFERENCES zones(id),
  route_id UUID REFERENCES routes(id),
  
  -- Collection Type
  collection_type VARCHAR(20), -- 'household', 'public_space', 'commercial', 'institutional', 'market', 'smart_bin', 'special'
  source_type VARCHAR(20), -- 'household', 'business', 'market', 'public_space', 'institution'
  subscription_id UUID, -- for household/business collections
  market_id UUID, -- for market collections
  
  -- Scheduling
  scheduled_time TIMESTAMP NOT NULL,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  
  -- Assignment
  assigned_officer_id UUID REFERENCES users(id),
  vehicle_id UUID,
  service_provider_id UUID REFERENCES service_providers(id),
  
  -- Waste Data
  total_weight DECIMAL(10, 2),
  weight_unit VARCHAR(10) DEFAULT 'kg',
  
  -- Metadata
  photos TEXT[],
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_collections_status ON collections(status);
CREATE INDEX idx_collections_scheduled_time ON collections(scheduled_time);
CREATE INDEX idx_collections_zone_id ON collections(zone_id);
CREATE INDEX idx_collections_route_id ON collections(route_id);
```

#### Waste Types Table
```sql
CREATE TABLE waste_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- hex color
  icon VARCHAR(50),
  is_recyclable BOOLEAN DEFAULT false,
  is_hazardous BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Zones Table
```sql
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  province VARCHAR(100),
  district VARCHAR(100),
  sector VARCHAR(100),
  boundaries JSONB, -- GeoJSON Polygon
  area_km2 DECIMAL(10, 2),
  population INTEGER,
  households INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

#### Routes Table
```sql
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  zone_id UUID REFERENCES zones(id),
  waypoints JSONB, -- Array of waypoint objects
  assigned_officer_id UUID REFERENCES users(id),
  vehicle_id UUID,
  efficiency DECIMAL(5, 2), -- percentage
  average_distance DECIMAL(10, 2), -- km
  average_time INTEGER, -- minutes
  collections_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  last_run_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Recycling Records Table
```sql
CREATE TABLE recycling_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id),
  material_type VARCHAR(50) NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  weight_unit VARCHAR(10) DEFAULT 'kg',
  facility_id UUID,
  facility_name VARCHAR(200),
  facility_type VARCHAR(20), -- 'recycling' or 'composting'
  co2_saved DECIMAL(10, 2), -- kg
  water_saved DECIMAL(10, 2), -- liters
  energy_saved DECIMAL(10, 2), -- kWh
  trees_saved DECIMAL(10, 2),
  processed_at TIMESTAMP,
  quality_grade VARCHAR(1), -- 'A', 'B', 'C'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recycling_material_type ON recycling_records(material_type);
CREATE INDEX idx_recycling_processed_at ON recycling_records(processed_at);
```

#### Service Providers Table
```sql
CREATE TABLE service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'private_company', 'cbo', 'cooperative'
  rura_license VARCHAR(50) UNIQUE,
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  service_areas UUID[], -- zone IDs
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'revoked'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_type VARCHAR(20) NOT NULL, -- 'household', 'business', 'institution'
  customer_name VARCHAR(200),
  contact_phone VARCHAR(20),
  location JSONB, -- {province, district, sector, address}
  service_provider_id UUID REFERENCES service_providers(id),
  collection_frequency VARCHAR(20), -- 'weekly', 'biweekly', 'daily'
  payment_plan VARCHAR(20), -- 'monthly', 'quarterly', 'annual'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Facility Operations Table
```sql
CREATE TABLE facility_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id VARCHAR(50) NOT NULL, -- 'nduba-landfill', 'nduba-sorting', 'nduba-bio-treatment'
  operation_type VARCHAR(50) NOT NULL, -- 'waste_received', 'waste_sorted', 'organic_processed'
  batch_id VARCHAR(50),
  input_weight DECIMAL(10, 2),
  output_weight DECIMAL(10, 2),
  weight_unit VARCHAR(10) DEFAULT 'tons',
  operation_data JSONB, -- flexible data structure
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facility_operations_facility ON facility_operations(facility_id);
CREATE INDEX idx_facility_operations_type ON facility_operations(operation_type);
CREATE INDEX idx_facility_operations_processed_at ON facility_operations(processed_at);
```

#### Markets Table
```sql
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  location JSONB, -- {province, district, sector, address, coordinates}
  vendor_count INTEGER,
  collection_frequency VARCHAR(20), -- 'daily', 'biweekly', etc.
  typical_organic_percentage DECIMAL(5, 2), -- percentage
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Real-time vs Batch Collection

### Real-time Collection

**Use Cases:**
- Collection status updates
- Route tracking
- Emergency alerts
- Live dashboard updates

**Technology:**
- WebSocket connections
- Server-Sent Events (SSE)
- Message queue subscriptions

**Implementation:**
```typescript
// WebSocket connection for real-time updates
const ws = new WebSocket('wss://api.wms.rw/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'collection.status.changed':
      updateCollectionStatus(data.collectionId, data.status);
      break;
    case 'route.location.updated':
      updateRouteLocation(data.routeId, data.location);
      break;
  }
};
```

### Batch Collection

**Use Cases:**
- Daily statistics
- Monthly reports
- Trend calculations
- Aggregated metrics

**Schedule:**
- **Hourly**: Route efficiency calculations
- **Daily** (00:00 UTC): Collection statistics, waste type aggregations
- **Weekly** (Monday 00:00 UTC): Weekly reports
- **Monthly** (1st 00:00 UTC): Monthly recycling metrics

**Implementation:**
```typescript
// Scheduled job (using node-cron)
import cron from 'node-cron';

// Daily aggregation at midnight
cron.schedule('0 0 * * *', async () => {
  await aggregateDailyCollections();
  await calculateWasteTypeStats();
  await updateRecyclingMetrics();
});
```

---

## Data Validation & Quality

### Validation Rules

#### Collection Data
- `scheduledTime` must be in the future (for new collections)
- `totalWeight` must be > 0
- `wasteTypes` array must sum to `totalWeight` (±5% tolerance)
- `location` coordinates must be within Rwanda bounds
- `status` transitions must be valid (e.g., cannot go from 'completed' to 'in_progress')

#### Zone Data
- `boundaries` must be valid GeoJSON Polygon
- `area` must match calculated area from boundaries
- `code` must be unique

#### Route Data
- `waypoints` must have at least 2 points
- `efficiency` must be between 0 and 100
- `assignedOfficer` must be active

### Data Quality Checks

1. **Completeness**: Required fields must be present
2. **Accuracy**: Numeric values within expected ranges
3. **Consistency**: Related data must be consistent
4. **Timeliness**: Data should be collected within expected timeframes
5. **Uniqueness**: No duplicate records

### Error Handling

```typescript
interface ValidationError {
  field: string
  message: string
  code: string
}

// Example validation
function validateCollection(data: CollectionInput): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!data.scheduledTime) {
    errors.push({
      field: 'scheduledTime',
      message: 'Scheduled time is required',
      code: 'REQUIRED'
    });
  }
  
  if (data.totalWeight <= 0) {
    errors.push({
      field: 'totalWeight',
      message: 'Total weight must be greater than 0',
      code: 'INVALID_VALUE'
    });
  }
  
  return errors;
}
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Weeks 1-2)
- [ ] Set up database schema
- [ ] Implement API endpoints
- [ ] Set up message queue
- [ ] Configure WebSocket server
- [ ] Implement authentication

### Phase 2: Data Collection (Weeks 3-4)
- [ ] Implement collection event handlers
- [ ] Set up batch processing jobs
- [ ] Create data validation layer
- [ ] Implement error handling

### Phase 3: Real-time Updates (Week 5)
- [ ] WebSocket integration
- [ ] Real-time dashboard updates
- [ ] Push notifications

### Phase 4: Analytics & Reporting (Week 6)
- [ ] Implement aggregation queries
- [ ] Set up TimescaleDB for time-series
- [ ] Create reporting endpoints
- [ ] Build dashboard data feeds

### Phase 5: Testing & Optimization (Week 7)
- [ ] Load testing
- [ ] Performance optimization
- [ ] Data quality audits
- [ ] Documentation updates

---

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Data Collection Rate**
   - Events per second
   - API request latency
   - Queue depth

2. **Data Quality**
   - Validation error rate
   - Missing data percentage
   - Duplicate detection

3. **System Health**
   - Database connection pool
   - Cache hit rate
   - WebSocket connection count

### Alerts

- High validation error rate (>5%)
- Queue depth exceeding threshold
- Database connection failures
- Missing scheduled batch jobs

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Data Encryption**: Sensitive data encrypted at rest and in transit
4. **Rate Limiting**: API rate limits to prevent abuse
5. **Input Sanitization**: All inputs validated and sanitized
6. **Audit Logging**: All data modifications logged

---

## Conclusion

This document provides a comprehensive guide for implementing data collection across all admin dashboard pages. The architecture is designed to be:

- **Scalable**: Handle increasing data volumes
- **Reliable**: Ensure data integrity and availability
- **Real-time**: Provide up-to-date information
- **Maintainable**: Clear structure and documentation

For questions or clarifications, please refer to the API documentation or contact the development team.

---

---

## Appendix: Rwanda-Specific Data Collection Examples

### Market Waste Collection Workflow

1. **Collection Scheduled**
   - Market identified (e.g., Kimisagara Market)
   - Collection time scheduled (typically early morning)
   - Route assigned

2. **Collection Execution**
   - Officer arrives at market
   - Collects waste from designated points
   - Records weight and composition
   - High organic waste percentage expected (60-80%)

3. **Transport to Facility**
   - Waste transported to Nduba Landfill
   - Weighed at weighbridge
   - Sorted at sorting facility
   - Organic waste sent to bio-treatment facility

4. **Data Collection Points**
   - Collection start/completion (mobile app)
   - Weight at weighbridge (automated)
   - Sorting results (facility system)
   - Processing results (bio-treatment facility)

### Household Collection Workflow

1. **Subscription Management**
   - Household registers for service
   - Service provider assigned
   - Payment plan established
   - Collection schedule set (typically weekly)

2. **Collection Day**
   - Route optimized for efficiency
   - Officer follows assigned route
   - Collects from subscribed households
   - Records collection status

3. **Payment Tracking**
   - Payment received (mobile money, bank transfer, cash)
   - Payment recorded in system
   - Service delivery linked to payment

### E-Waste Collection Workflow

1. **Collection Point**
   - Public drop-off at designated point
   - Or scheduled pickup service
   - Items categorized and weighed

2. **Transport to Facility**
   - Collected by specialized vehicle
   - Transported to Enviroserve facility

3. **Processing**
   - Items sorted by type and condition
   - Recyclable components extracted
   - Remanufacturing or proper disposal

---

**Document Version**: 2.0  
**Last Updated**: 2024-01-15  
**Author**: WMS Development Team  
**Rwanda Context**: Integrated

