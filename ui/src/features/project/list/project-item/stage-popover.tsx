import { createQueryOptions, useQuery, useTransport } from '@connectrpc/connect-query';
import { faBox, faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQueries } from '@tanstack/react-query';
import moment from 'moment';
import { useMemo } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';

import { paths } from '@ui/config/paths';
import { getAlias } from '@ui/features/common/utils';
import {
  getFreight,
  getPromotion
} from '@ui/gen/api/service/v1alpha1/service-KargoService_connectquery';
import { Freight, FreightReference, Promotion, Stage } from '@ui/gen/api/v1alpha1/generated_pb';
import { timestampDate } from '@ui/utils/connectrpc-utils';

export const StagePopover = ({ project, stage }: { project?: string; stage?: Stage }) => {
  const { data: promotionData } = useQuery(
    getPromotion,
    {
      name: stage?.status?.lastPromotion?.name,
      project
    },
    {
      enabled: !!stage?.status?.lastPromotion?.name
    }
  );
  const promotion = useMemo(() => promotionData?.result?.value as Promotion, [promotionData]);

  const transport = useTransport();

  const freightData = useQueries({
    queries: Object.values(stage?.status?.freightHistory[0]?.items || {}).map(
      (freight: FreightReference) => {
        return {
          ...createQueryOptions(getFreight, { project, name: freight.name }, { transport }),
          enabled: !!freight.name
        };
      }
    )
  });

  const _label = ({ children }: { children: string }) => (
    <div className='text-xs font-semibold text-gray-300 mb-1'>{children}</div>
  );

  const navigate = useNavigate();

  return (
    <div>
      <_label>LAST PROMOTED</_label>
      <div className='flex items-center mb-4'>
        <FontAwesomeIcon icon={faClock} className='mr-2' />
        <div>
          {moment(timestampDate(promotion?.metadata?.creationTimestamp)).format(
            'MMM do yyyy HH:mm:ss'
          )}
        </div>
      </div>
      <_label>CURRENT FREIGHT</_label>
      {Object.values(stage?.status?.freightHistory[0]?.items || {}).map((_, i) => (
        <div className='flex items-center mb-2' key={i}>
          <FontAwesomeIcon icon={faBox} className='mr-2' />
          <div>{getAlias(freightData[i]?.data?.result?.value as Freight)}</div>
        </div>
      ))}
      <div
        onClick={(e) => {
          e.preventDefault();
          navigate(generatePath(paths.stage, { name: project, stageName: stage?.metadata?.name }));
        }}
        className='underline text-blue-400 font-semibold w-full text-center cursor-pointer'
      >
        DETAILS
      </div>
    </div>
  );
};
