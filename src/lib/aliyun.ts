// ─── AliCloud ECS SDK ───────────────────────────────────────────────────────────
import Ecs20140526, {
  CreateInstanceRequest,
  DescribeInstancesRequest,
  AllocatePublicIpAddressRequest,
  StartInstanceRequest,
  DeleteInstanceRequest,
} from '@alicloud/ecs20140526';

// ─── Region Config ─────────────────────────────────────────────────────────────
export const REGIONS = {
  'ap-southeast-1': { zoneId: 'ap-southeast-1a', instanceType: 'ecs.gn7i-c8g1.4xlarge' },
  'us-west-1':      { zoneId: 'us-west-1a',       instanceType: 'ecs.gn7i-c8g1.4xlarge' },
  'cn-hongkong':    { zoneId: 'cn-hongkong-e',    instanceType: 'ecs.gn7i-c8g1.4xlarge' },
} as const;

export type RegionKey = keyof typeof REGIONS;

export interface AliyunConfig {
  accessKeyId: string;
  accessKeySecret: string;
  region: RegionKey;
}

// ─── Create AliCloud Client ────────────────────────────────────────────────────
function makeClient(config: AliyunConfig) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Client = (Ecs20140526 as any).default ?? Ecs20140526;
  return new Client({
    accessKeyId:     config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    endpoint:        `ecs.${config.region}.aliyuncs.com`,
  });
}

// ─── Instance Spec ────────────────────────────────────────────────────────────
export interface InstanceSpec {
  region: RegionKey;
  imageId?: string;
  instanceType?: string;
  zoneId?: string;
  securityGroupId: string;
  vswitchId: string;
  sshKeyPair?: string;
  instanceName: string;
  hostName: string;
  tags?: Record<string, string>;
}

// ─── Create GPU Instance ──────────────────────────────────────────────────────
export async function createInstance(
  config: AliyunConfig,
  spec: InstanceSpec
): Promise<{ instanceId: string; publicIp: string; privateIp: string }> {
  const client = makeClient(config);
  const regionCfg = REGIONS[config.region];

  const req = new CreateInstanceRequest({
    regionId:           config.region,
    zoneId:             spec.zoneId ?? regionCfg.zoneId,
    instanceType:       spec.instanceType ?? regionCfg.instanceType,
    imageId:            spec.imageId ?? 'ubuntu_22_04_64_20G_alibase_20231221.vhd',
    securityGroupId:    spec.securityGroupId,
    vswitchId:          spec.vswitchId,
    instanceName:       spec.instanceName,
    hostName:           spec.hostName,
    internetMaxBandwidthOut: 100,
    internetMaxBandwidthIn:  100,
    password:           spec.sshKeyPair ? undefined : 'Yangtze2024!',
    keyPairName:        spec.sshKeyPair,
    systemDiskCategory: 'cloud_essd',
    systemDiskSize:     40,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp = await (client as any).createInstance(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instanceId: string = resp?.body?.instanceId;
  if (!instanceId) throw new Error('AliCloud createInstance returned no instanceId');

  console.log(`[Aliyun] Created instance ${instanceId}`);
  await waitForStatus(client, config.region, instanceId, 'Running');

  // Allocate public IP
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (client as any).allocatePublicIpAddress(new AllocatePublicIpAddressRequest({ instanceId }));

  // Get IPs
  const desc = await describeInstance(client, config.region, instanceId);
  const publicIp  = desc.publicIpAddress?.ipAddress?.[0] ?? '';
  const privateIp = desc.innerIpAddress?.ipAddress?.[0] ?? '';

  console.log(`[Aliyun] Instance ${instanceId} ready — ${publicIp}`);
  return { instanceId, publicIp, privateIp };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function describeInstance(client: any, regionId: string, instanceId: string): Promise<any> {
  const r = await client.describeInstances(
    new DescribeInstancesRequest({ regionId, instanceIds: [instanceId] })
  );
  const inst = r.body?.instances?.instance?.[0];
  if (!inst) throw new Error(`Instance ${instanceId} not found`);
  return inst;
}

async function waitForStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  regionId: string,
  instanceId: string,
  target: string,
  timeoutMs = 300_000
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const inst = await describeInstance(client, regionId, instanceId);
    if (inst.status === target) return;
    if (inst.status === 'Stopped') {
      await client.startInstance(new StartInstanceRequest({ instanceId, regionId }));
    }
    await sleep(10_000);
  }
  throw new Error(`Instance ${instanceId} never reached ${target}`);
}

export async function getInstanceConnectionInfo(
  config: AliyunConfig,
  instanceId: string
): Promise<{ ip: string; port: number; username: string }> {
  const client = makeClient(config);
  const inst = await describeInstance(client, config.region, instanceId);
  const ip = inst.publicIpAddress?.ipAddress?.[0]
    ?? inst.eipAddress?.ipAddress?.[0]
    ?? '';
  if (!ip) throw new Error(`No IP for instance ${instanceId}`);
  return { ip, port: 22, username: 'ubuntu' };
}

export async function terminateInstance(config: AliyunConfig, instanceId: string) {
  const client = makeClient(config);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (client as any).deleteInstance(
    new DeleteInstanceRequest({ instanceId, regionId: config.region, force: true })
  );
  console.log(`[Aliyun] Deleted instance ${instanceId}`);
}

// ─── Region Requirements (user must configure these first) ───────────────────────
export const REGION_REQUIREMENTS = {
  // TODO: Replace with real IDs after running AliCloud setup script
  'ap-southeast-1': { securityGroupId: 'sg-REPLACE-ME', vswitchId: 'vsw-REPLACE-ME' },
  'us-west-1':      { securityGroupId: 'sg-REPLACE-ME', vswitchId: 'vsw-REPLACE-ME' },
  'cn-hongkong':    { securityGroupId: 'sg-REPLACE-ME', vswitchId: 'vsw-REPLACE-ME' },
} as const;

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
