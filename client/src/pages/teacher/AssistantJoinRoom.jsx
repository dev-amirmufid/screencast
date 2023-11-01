import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Alert from "../../components/common/Alert";
import { useGetDataQuery } from "../../store/services/request";
import { joinRoom } from "../../store/features/monitoringSlice";
import { joinAssistant, initAssistant, leaveAssistant } from "../../store/features/assistantSlice";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useTranslation } from "react-i18next";
import { useStoreAssistantMutation } from "../../store/services/teachers";
import { setWsRoomId, wsSend } from "../../store/redux/websocket/actions";


const AssistantJoinRoom = () => {

  const {t} = useTranslation();
  const dispatch = useDispatch()
  const assistant = useSelector((state)=>state.assistant)
  const [assistantRoom,setassistantRoom] = useLocalStorage('assistantRoom',null)
  const navigate = useNavigate()
  const auth = useAuth();
  const { tenant_id,room_uri } = useParams();
  
  const room = useGetDataQuery({
    endpoint: 'rooms/roomUri/'+room_uri,
    params: {
      tenant_id : tenant_id
    }
  },{
    skip:!room_uri
  });

  const [storeAssistant, resultStoreAssistant] = useStoreAssistantMutation();

  const [alert, setAlert] = useState({
    isOpen: false,
    title: "Alert",
    excerpt: "Tenant does'nt match"
  });

  
  const loginProccess = () =>{
    auth.signin({
      username : resultStoreAssistant.data.data.username,
      password : resultStoreAssistant.data.data.username,
      room_id : room.data.data.rooms.id
    }, 'teacher', ({data,error}) => {
      handleLoginResponse(data,error)
    });
  }
  const handleLoginResponse = (data,error) => {
    
    if(error){
      var message = (error.data?.code && error.data?.code ==401)? auth.tenants?.data?.data?.linkage_type == 'oidc' ? t("alert.text.unauthorized_oidc") : t("alert.text.unauthorized") :error.data?.error_code ? t(`${error.data?.error_code}`) : error.data?.message;
      setAlert({
        isOpen: true,
        title: t("alert.name"),
        excerpt: message,
      });
    }
    if(data){
      dispatch(wsSend({
        type : "user-login",
        data: {
          tenant: tenant_id,
          userId: data.data.id,
          userType : 'teacher'
        }
      }));

      if(room && room?.data && room?.data?.data){  
        var send = {
          quota: (room?.data?.data?.tenants?.limit)?room?.data?.data?.tenants?.user_limit:'unlimited',
          tenant_id: data.data.tenant_id,
          teacher_id: data.data.id,
          user_id: data.data.id,
          username: data.data.username,
          user_type: data.data.role,
          room_id: room?.data?.data?.rooms.id,
          room_name: room?.data?.data?.rooms.name,
          room_uri: room?.data?.data?.rooms.uri,
          temporary: room?.data?.data?.rooms?.temporary ? room?.data?.data?.rooms.temporary : false,
          studentURL: { qrcode: "", url: room?.data?.data?.rooms?.link?.replace('{user_type}','student') },
          assistantURL: { qrcode: "", url: room?.data?.data?.rooms?.link?.replace('{user_type}','assistant') }
        }
        
        setassistantRoom(send);

        dispatch(wsSend({
          type : "fetch_room",
          tenant_id : data.data.tenant_id,
          room_id : room.data.data.rooms.id
        }));
        
        dispatch(joinRoom(send))
        dispatch(setWsRoomId(null))
      //console.log('success 1')
      }else{
        navigate(`/teacher`)
      }
      
    }
  }

  useEffect(() => {
    if(resultStoreAssistant.isSuccess){
      loginProccess()
    }
    if(resultStoreAssistant.isError){
    //console.log(resultStoreAssistant,'resultStoreAssistant')
    }
  }, [resultStoreAssistant]);
  
  useEffect(() => {
    if(room.isSuccess){
      const room_data = room.data.data
      if(room_data){  
        if(!auth.user){
            storeAssistant({
              tenant_id : tenant_id,
              room_id : room_data.rooms.id,
              school_id : room_data.rooms.school_id || tenant_id,
              room_name : room_data.rooms.name
            })
        } else if(assistantRoom){
        //console.log(auth.user,'auth.user')
          if(tenant_id == auth.user.data.tenant_id){  
            dispatch(joinRoom(assistantRoom))
            dispatch(joinAssistant(assistantRoom))
          } else {
            setAlert({
              ...alert,
              isOpen: true
            })
            dispatch(leaveAssistant())
          }
        }
       
      } else {
        setAlert({
          isOpen: true,
          title: t('alert.name'),
          excerpt: t('alert.text.room_not_exists')
        })
        dispatch(leaveAssistant())
      }
    }
  }, [assistant.isAssistant,room,auth?.user,assistantRoom]);
  
  let joinStatusTimeout = null

  useEffect(() => {
    clearTimeout(joinStatusTimeout)
    if(assistant.isAssistant){
        if(assistant.joinStatus){
          navigate("/assistant/monitoring")
        } else {
          joinStatusTimeout = setTimeout(() => {
            setAlert({
              isOpen: true,
              title: t('alert.name'),
              excerpt: t('alert.text.room_not_exists')
            })   
          }, 500);
          dispatch(leaveAssistant())   
        }
    }
  }, [assistant.joinStatus]);

  return <Alert handleChange={() => {
    navigate("/teacher")
  }} alert={alert} />
}

export default AssistantJoinRoom;
